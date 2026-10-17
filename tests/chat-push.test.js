const test=require('node:test')
const assert=require('node:assert/strict')
const {Op}=require('sequelize')
const sent=[],removed=[],userQueries=[]
const users=[{id:1,deleted:false},{id:2,deleted:false},{id:3,deleted:true},{id:4,deleted:false}]
const devices=[{id:1,user_id:1,token:'sender'},{id:2,user_id:2,token:'recipient'},{id:3,user_id:3,token:'deleted'},{id:4,user_id:4,token:'outsider'}]
const mocks={
 '../models/user.model':{findAll:async({where})=>{userQueries.push(where);return users.filter(user=>!user.deleted && (where.id[Op.in]?where.id[Op.in].includes(user.id):user.id!==where.id[Op.ne]))}},
 '../models/chat-device.model':{findAll:async({where})=>devices.filter(device=>where.user_id[Op.in].includes(device.user_id)),destroy:async options=>removed.push(options.where.id[Op.in])},
 'firebase-admin/app':{getApps:()=>[],applicationDefault:()=>({}),initializeApp:()=>({})},
 'firebase-admin/messaging':{getMessaging:()=>({sendEach:async messages=>{sent.push(...messages);return{responses:messages.map(message=>message.token==='recipient'?{success:false,error:{code:'messaging/registration-token-not-registered'}}:{success:true})}}})},
}
for(const [name,exports]of Object.entries(mocks)){const filename=require.resolve(name);require.cache[filename]={id:filename,filename,loaded:true,exports}}
const service=require('../services/chat-push.service')
test('private pushes exclude sender, deleted accounts, and non-members; invalid tokens are removed',async()=>{
 process.env.CHAT_PUSH_ENABLED='true'
 await service.sendChatPush({server_id:7,room_id:5,sender_id:1,sender:'One',text:'Private'},[1,2,3],{type:'group',name:'Team'})
 assert.equal(sent.length,1)
 assert.equal(sent[0].token,'recipient')
 assert.equal(sent[0].data.account_id,'2')
 assert.equal(sent[0].notification.title,'One · Team')
 assert.equal(sent[0].android.notification.channelId,'chat-messages')
 assert.deepEqual(removed,[[2]])
})
test('disabled Firebase does not query devices or send remote notifications',async()=>{
 process.env.CHAT_PUSH_ENABLED='false'
 const previous=sent.length,queries=userQueries.length
 await service.sendChatPush({sender_id:1},null,{type:'general'})
 assert.equal(sent.length,previous)
 assert.equal(userQueries.length,queries)
})
