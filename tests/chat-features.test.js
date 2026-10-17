const test=require('node:test')
const assert=require('node:assert/strict')
const path=require('node:path')
const {inspectAttachment,MAX_BYTES}=require('../services/chat-attachment-rules')
let deletions,files,details,receipts,events
const user={id:2,name:'User'}
const messages=[{id:10,room_id:2,sender_id:3,text:'Original'},{id:20,room_id:2,sender_id:3,text:'Latest'},{id:30,room_id:3,sender_id:3,text:'Other room'}]
const fail=(status,message)=>{throw Object.assign(new Error(message),{status})}
const access={action:fn=>async(req,res)=>{try{await fn(req,res,user)}catch(error){res.status(error.status||500).json({message:error.message})}},
 authorizedRoom:async id=>{if(Number(id)!==2)fail(403,'Not a member');return{id:2,type:'group'}},recipientIds:async()=>[2,3],messageView:message=>({server_id:message.id,room_id:message.room_id,text:message.text})}
const mocks={
 '../controllers/Chat/chat.controller':{access},
 '../utils/data/database':{transaction:async fn=>fn({LOCK:{UPDATE:'update'}}),query:async(sql,{replacements:r})=>{if(!sql.includes('INSERT INTO'))return;let row=receipts.find(item=>item.room_id===r.room&&item.user_id===r.user);if(!row){row={room_id:r.room,user_id:r.user,message_id:0};receipts.push(row)}if(r.message>row.message_id)Object.assign(row,{message_id:r.message,read_at:new Date()})}},
 '../models/chat-room.model':{Message:{findOne:async({where})=>messages.find(item=>item.id===where.id&&item.room_id===where.room_id)}},
 '../models/chat-features.model':{
  Attachment:{findByPk:async id=>files.find(item=>item.id===id),sum:async()=>files.reduce((sum,item)=>sum+item.size,0),create:async values=>{const file={...values,destroy:async()=>{files=files.filter(item=>item.id!==file.id)}};files.push(file);return file}},
  Detail:{update:async(values,{where})=>{for(const item of details)if(item.message_id===where.message_id)Object.assign(item,values)},findOne:async({where})=>details.find(item=>item.attachment_id===where.attachment_id),findOrCreate:async({where})=>{let row=details.find(item=>item.message_id===where.message_id);if(!row){row={...where,update:async values=>Object.assign(row,values)};details.push(row)}return[row]}},
  Receipt:{findOne:async({where})=>receipts.find(item=>item.room_id===where.room_id&&item.user_id===where.user_id)},
 },
 '../services/chat-features.service':{attachmentView:file=>({id:file.id,name:file.name,mime:file.mime,size:file.size}),enrich:async items=>items.map(item=>({...item,pinned:details.find(row=>row.message_id===item.server_id)?.pinned}))},
 '../services/chat-socket.service':{notify:(...args)=>events.push(args)},
}
for (const [name, filename] of [['Attachment', 'chat-attachment'], ['Detail', 'chat-message-detail'], ['Receipt', 'chat-read']]) {
    mocks['../models/' + filename + '.model'] = mocks['../models/chat-features.model'][name]
}
mocks['../models/chat-message-deletion.model'] = {
 findByPk: async id => deletions.find(item => item.message_id === id),
 findAll: async ({where}) => deletions.filter(item => item.room_id === where.room_id),
 findOrCreate: async ({where,defaults}) => { let item=deletions.find(row=>row.message_id===where.message_id);if(!item){item={...where,...defaults};deletions.push(item)}return[item] },
}
for(const message of messages) message.update=async values=>Object.assign(message,values)

for(const [relative,exports]of Object.entries(mocks)){const filename=require.resolve(path.join(__dirname,relative));require.cache[filename]={id:filename,filename,loaded:true,exports}}
const controller=require('../controllers/Chat/chat-features.controller')
function reset(){deletions=[];messages[0].sender_id=3;messages[0].text='Original';files=[];details=[];receipts=[];events=[]}
async function request(method,{params={},body={},headers={}}={}){const res={statusCode:200,headers:{},status(code){this.statusCode=code;return this},json(body){this.body=body;return this},set(values){Object.assign(this.headers,values)},send(body){this.body=body}};await controller[method]({params,body,get:key=>headers[key]},res);return res}
const upload=()=>request('Upload',{params:{roomId:2},body:Buffer.from('%PDF-1.7 example'),headers:{'X-File-Name':encodeURIComponent('report.pdf'),'X-Upload-Id':'same-client-message'}})
test('attachment validation rejects spoofed/unsafe file types and enforces size',()=>{
 assert.equal(inspectAttachment('../report.pdf',Buffer.from('%PDF-1.7')).name,'report.pdf')
 assert.equal(inspectAttachment('notes.txt',Buffer.from('hello')).mime,'text/plain')
 for(const [name,body]of [['image.png',Buffer.from('<script>bad</script>')],['image.svg',Buffer.from('<svg/>')],['program.exe',Buffer.from('MZ')],['empty.txt',Buffer.alloc(0)],['large.txt',Buffer.alloc(MAX_BYTES+1)]])assert.throws(()=>inspectAttachment(name,body),error=>error.status===400)
})
test('private uploads retry idempotently without duplicating binary storage',async()=>{
 reset();const first=await upload();const second=await upload()
 assert.equal(first.statusCode,201);assert.equal(first.body.id,second.body.id);assert.equal(files.length,1)
 const conflict=await request('Upload',{params:{roomId:2},body:Buffer.from('%PDF-other'),headers:{'X-File-Name':'report.pdf','X-Upload-Id':'same-client-message'}})
 assert.equal(conflict.statusCode,409);assert.equal(files.length,1)
})
test('downloads enforce membership and hide unlinked uploads from other users',async()=>{
 reset();const created=await upload();const file=files[0]
 assert.equal((await request('Download',{params:{id:created.body.id}})).statusCode,200)
 file.owner_id=3
 assert.equal((await request('Download',{params:{id:file.id}})).statusCode,404)
 details.push({message_id:10,attachment_id:file.id})
 const download=await request('Download',{params:{id:file.id}})
 assert.equal(download.headers['X-Content-Type-Options'],'nosniff');assert.ok(download.headers['Content-Disposition'].startsWith('attachment;'))
 file.room_id=3
 assert.equal((await request('Download',{params:{id:file.id}})).statusCode,403)
})
test('read receipts stay monotonic across devices and reject another room’s message',async()=>{
 reset()
 assert.equal((await request('Read',{params:{roomId:2},body:{message_id:20}})).body.message_id,20)
 assert.equal((await request('Read',{params:{roomId:2},body:{message_id:10}})).body.message_id,20)
 assert.equal((await request('Read',{params:{roomId:2},body:{message_id:30}})).statusCode,404)
 assert.deepEqual(events[0][0],[2,3]);assert.equal(events[0][1],'receipt')
})
test('pins can be removed and changes are delivered only to room members',async()=>{
 reset()
 assert.equal((await request('Pin',{params:{roomId:2,messageId:10},body:{pinned:true}})).statusCode,200)
 assert.equal(details[0].pinned,true)
 await request('Pin',{params:{roomId:2,messageId:10},body:{pinned:false}})
 assert.equal(details[0].pinned,false)
 assert.equal((await request('Pin',{params:{roomId:3,messageId:30},body:{pinned:true}})).statusCode,403)
 assert.equal((await request('Pin',{params:{roomId:2,messageId:30},body:{pinned:true}})).statusCode,404)
 assert.ok(events.every(event=>event[0].join(',')==='2,3'))
})

test('deleting messages requires ownership and preserves an idempotent tombstone', async () => {
 reset()
 assert.equal((await request('Delete',{params:{roomId:2,messageId:10}})).statusCode,403)
 assert.equal((await request('Delete',{params:{roomId:2,messageId:30}})).statusCode,404)
 assert.equal(deletions.length,0)
 messages[0].sender_id=2
 details.push({message_id:10,pinned:true})
 const result=await request('Delete',{params:{roomId:2,messageId:10}})
 assert.equal(result.statusCode,200)
 assert.equal(result.body.text,'Deleted Message')
 assert.equal(details[0].pinned,false)
 await request('Delete',{params:{roomId:2,messageId:10}})
 assert.equal(deletions.length,1)
 assert.equal(events[0][1],'message_updated')
 assert.equal((await request('Deletions',{params:{roomId:2}})).body[0].message_id,10)
 assert.equal((await request('Deletions',{params:{roomId:3}})).statusCode,403)
 assert.equal((await request('Pin',{params:{roomId:2,messageId:10},body:{pinned:true}})).statusCode,409)
})

test('a deleted message attachment cannot be downloaded again', async () => {
 reset()
 const result=await upload()
 details.push({message_id:10,attachment_id:result.body.id})
 deletions.push({message_id:10,room_id:2})
 assert.equal((await request('Download',{params:{id:result.body.id}})).statusCode,404)
})
