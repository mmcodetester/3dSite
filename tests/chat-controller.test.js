const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { Op } = require('sequelize')
// Load the real controller with an isolated database and socket boundary; no DB_URL is used.
const user = { id: 2, name: 'Current User' }
let details = [], rooms, members, messages, nextMessageId, notifications, queryOptions
const Room = {
    findByPk: async id => rooms.find(room => room.id === id),
    findAll: async () => rooms,
    findOrCreate: async ({where,defaults}) => {
        const existing = rooms.find(room => room.direct_key === where.direct_key)
        if (existing) return [existing, false]
        const room = {id: rooms.length + 1,...where,...defaults}; rooms.push(room); return [room,true]
    },
    create: async values => { const room = {id: rooms.length + 1,...values}; rooms.push(room); return room },
}
const Member = {
    findOne: async ({where}) => members.find(member => member.room_id === where.room_id && member.user_id === where.user_id),
    findAll: async ({where}) => members.filter(member => Object.entries(where).every(([key,value]) => member[key] === value)),
    bulkCreate: async rows => { for(const row of rows) if(!members.some(member=> member.room_id===row.room_id && member.user_id===row.user_id)) members.push(row) },
}
const Message = {
    findOne:async({where})=>messages.find(message=>message.id===where.id && message.room_id===where.room_id),
    findOrCreate: async ({where,defaults}) => {
        const existing = messages.find(message => message.sender_id===where.sender_id && message.client_id===where.client_id)
        if(existing) return [existing,false]
        const message = {id:nextMessageId++,...where,...defaults}; messages.push(message); return [message,true]
    },
    findAll: async options => {
        queryOptions = options
        const forward = options.order[0][1] === 'ASC'
        return messages.filter(message => message.room_id === options.where.room_id &&
            (!options.where.id || (forward ? message.id > options.where.id[Op.gt] : message.id < options.where.id[Op.lt])))
            .sort((a,b) => forward ? a.id-b.id : b.id-a.id).slice(0,options.limit)
    },
}
const deviceChanges=[]
const pushCalls=[]
const mocks = {
    '../models/chat-features.model': {
        Detail: {findOne:async()=>null,findAll:async()=>[],findOrCreate:async({where,defaults})=>{let item=details.find(row=>row.message_id===where.message_id);if(item)return[item,false];item={...where,...defaults};details.push(item);return[item,true]}},
        Attachment: {findByPk:async()=>null}, Receipt:{findAll:async()=>[]},
    },
    '../services/chat-features.service': {enrich:async items=>items},
    '../models/chat-device.model': {destroy:async options=>deviceChanges.push(options),upsert:async values=>deviceChanges.push(values)},
    '../services/chat-push.service': {isConfigured:()=>false,sendChatPush:async(...args)=>pushCalls.push(args)},
    '../utils/data/database': { transaction: async work => work({}) },
    '../models/user.model': {
        findOne: async () => user,
        count: async ({where}) => where.id[Op.in].length,
        findAll: async () => [user,{id:3,name:'Other User'}],
    },
    '../models/chat-room.model': {Room, Member, Message},
    '../services/chat-socket.service': { onlineIds: () => [2], notify: (...args) => notifications.push(args) },
}
for (const [name, filename] of [['Attachment', 'chat-attachment'], ['Detail', 'chat-message-detail'], ['Receipt', 'chat-read']]) {
    mocks['../models/' + filename + '.model'] = mocks['../models/chat-features.model'][name]
}
mocks['../models/chat-message-deletion.model'] = { findByPk: async () => null, findAll: async () => [] }
for (const [relative,exports] of Object.entries(mocks)) {
    const filename = require.resolve(path.join(__dirname,relative))
    require.cache[filename] = { id: filename, filename, loaded: true, exports }
}
const controller = require('../controllers/Chat/chat.controller')
function reset() {
    rooms = [{id:1,type:'general',name:'General'},{id:2,type:'group',name:'Private'},{id:3,type:'direct'}]
    members = [{room_id:2,user_id:2},{room_id:2,user_id:3},{room_id:3,user_id:3}]
    messages = []; details=[]; nextMessageId = 1; notifications = []; queryOptions = null
}
async function request(method, body = {}, query = {}) {
    const res = {statusCode:200,status(code){this.statusCode=code;return this},json(value){this.body=value;return this}}
    await controller[method]({user,body,query},res)
    return res
}
test('non-members cannot read, send, or broadcast typing in a private room', async () => {
    reset()
    for(const [method,body,query] of [
        ['GetAll',{}, {room_id:3}], ['SendMessage',{room_id:3,text:'secret',client_id:'a'},{}],
        ['SendTypingEvent',{room_id:3},{}],
    ]) assert.equal((await request(method,body,query)).statusCode,403)
    assert.equal(messages.length,0)
    assert.equal(notifications.length,0)
})
test('replayed offline messages persist once and notify only conversation members', async () => {
    reset()
    const body = {room_id:2,text:'  Hello  ',client_id:'device-message-1'}
    const first = await request('SendMessage',body)
    const retry = await request('SendMessage',body)
    assert.equal(first.body.server_id,retry.body.server_id)
    assert.equal(messages.length,1)
    assert.equal(first.body.text,'Hello')
    assert.deepEqual(notifications[0][0],[2,3])
    assert.equal(notifications[0][1],'message')
    assert.equal((await request('SendMessage',{...body,room_id:1})).statusCode,409)
    assert.equal((await request('SendMessage',{...body,text:'Changed'})).statusCode,409)
})
test('general messages are available to active authenticated users and reject invalid input', async () => {
    reset()
    assert.equal((await request('SendMessage',{room_id:1,text:'Hello',client_id:'general-1'})).statusCode,200)
    assert.equal(notifications[0][0],null)
    for(const body of [{text:''},{text:'x'.repeat(4001)},{client_id:'bad id!'}]) {
        assert.equal((await request('SendMessage',{room_id:1,text:'Hello',client_id:'test',...body})).statusCode,400)
    }
})
test('history applies room isolation, bounded pages, and forward catch-up cursors', async () => {
    reset()
    messages = Array.from({length:125},(_,index)=>({id:index+1,room_id:2,sender_id:3,client_id:`m-${index}`,text:'hi',date:new Date()}))
    messages.push({id:126,room_id:1,sender_id:3,text:'Other room'})
    const first = await request('GetAll',{}, {room_id:2,limit:20})
    assert.equal(first.body.messages.length,20)
    assert.equal(first.body.has_more,true)
    assert.equal(first.body.messages[0].server_id,106)
    const forward = await request('GetAll',{}, {room_id:2,limit:20,direction:'forward',cursor:20})
    assert.equal(forward.body.messages[0].server_id,21)
    assert.equal(forward.body.messages.at(-1).server_id,40)
    await request('GetAll',{}, {room_id:2,limit:100000})
    assert.equal(queryOptions.limit,101)
})
test('reopening a direct conversation reuses the same room and memberships', async () => {
    reset()
    const body = {type:'direct',member_ids:[3]}
    const first = await request('CreateRoom',body)
    const second = await request('CreateRoom',body)
    assert.equal(first.body.id,second.body.id)
    assert.equal(first.body.name,'Other User')
    assert.deepEqual(first.body.members.map(member=>member.id),[2,3])
    assert.equal(members.filter(member=>member.room_id===first.body.id).length,2)
})


test('new chat messages trigger one push attempt while idempotent retries do not',async()=>{
 reset();pushCalls.length=0
 const body={room_id:2,text:'New message',client_id:'push-message'}
 await request('SendMessage',body);await request('SendMessage',body)
 assert.equal(pushCalls.length,1)
 assert.deepEqual(pushCalls[0][1],[2,3])
})
test('device registration binds to the logged-in account and unregister is account-scoped',async()=>{
 reset();deviceChanges.length=0
 assert.equal((await request('RegisterDevice',{installation_id:'short',token:'x'})).statusCode,400)
 const installation_id='installation-abcdefghijklmnop',token='fake-fcm-token-abcdefghijklmnop'
 const response=await request('RegisterDevice',{installation_id,token,user_id:99})
 assert.equal(response.statusCode,200)
 assert.equal(response.body.push_configured,false)
 assert.equal(deviceChanges.at(-1).user_id,2)
 await request('UnregisterDevice',{installation_id})
 assert.equal(deviceChanges.at(-1).where.user_id,2)
})

test('replies are room-scoped and retries cannot change their reply target',async()=>{
 reset()
 const first=await request('SendMessage',{room_id:2,text:'Original',client_id:'original'})
 const reply=await request('SendMessage',{room_id:2,text:'Reply',client_id:'reply',reply_to_id:first.body.server_id})
 assert.equal(reply.statusCode,200)
 assert.equal(details.find(item=>item.message_id===reply.body.server_id).reply_to_id,first.body.server_id)
 assert.equal((await request('SendMessage',{room_id:1,text:'Cross-room reply',client_id:'cross',reply_to_id:first.body.server_id})).statusCode,400)
 assert.equal((await request('SendMessage',{room_id:2,text:'Reply',client_id:'reply'})).statusCode,409)
})
