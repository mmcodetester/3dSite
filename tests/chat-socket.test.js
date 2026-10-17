const test = require('node:test')
const assert = require('node:assert/strict')
const jwt = require('jsonwebtoken')
process.env.SECRET_KEY = 'isolated-chat-socket-test-secret'
let activeUser = true
const userFile = require.resolve('../models/user.model')
require.cache[userFile] = {id:userFile,filename:userFile,loaded:true,exports:{findOne:async({where})=>activeUser?{id:where.id,name:'Test User'}:null}}
const service = require('../services/chat-socket.service')
function namespace() {
    const events=[]
    const ns={events,use(handler){this.middleware=handler},on(event,handler){if(event==='connection')this.connect=handler},emit:(...args)=>events.push(args),to(rooms){return{emit:(...args)=>events.push({rooms,args})}}}
    service.init({of:name=>{assert.equal(name,'/chat');return ns}})
    return ns
}
function socket(id,token) {
    return {id,handshake:{auth:{token}},data:{},handlers:{},joined:[],join(room){this.joined.push(room)},on(event,handler){this.handlers[event]=handler},disconnect(){this.handlers.disconnect?.()}}
}
const authorize = (ns,sock)=>new Promise(resolve=>ns.middleware(sock,resolve))
test('chat sockets reject anonymous, invalid, expired, and deleted-account sessions',async()=>{
    const ns=namespace()
    for(const token of [undefined,'invalid',jwt.sign({id:2},process.env.SECRET_KEY,{expiresIn:-1})]) {
        assert.equal((await authorize(ns,socket('invalid',token))).message,'Unauthorized')
    }
    activeUser=false
    assert.equal((await authorize(ns,socket('deleted',jwt.sign({id:2},process.env.SECRET_KEY,{expiresIn:60})))).message,'Unauthorized')
    activeUser=true
})
test('authenticated devices join only their own delivery room and retain presence until the last disconnect',async()=>{
    const ns=namespace()
    const token=jwt.sign({id:2},process.env.SECRET_KEY,{expiresIn:60})
    const a=socket('tab-a',token),b=socket('tab-b',token)
    await authorize(ns,a);await authorize(ns,b)
    ns.connect(a);ns.connect(b)
    try {
        assert.deepEqual(a.joined,['user:2'])
        assert.deepEqual(service.onlineIds(),[2])
        a.disconnect()
        assert.deepEqual(service.onlineIds(),[2])
        service.notify([2,3],'message',{text:'Private'})
        assert.deepEqual(ns.events.at(-1),{rooms:['user:2','user:3'],args:['message',{text:'Private'}]})
    } finally {a.disconnect();b.disconnect()}
    assert.deepEqual(service.onlineIds(),[])
})
