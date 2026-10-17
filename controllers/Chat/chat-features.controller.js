const { createHash } = require('node:crypto')
const { Op } = require('sequelize')
const database = require('../../utils/data/database')
const { Message } = require('../../models/chat-room.model')
const { Attachment, Detail, Receipt } = require('../../models/chat-features.model')
const { inspectAttachment } = require('../../services/chat-attachment-rules')
const features = require('../../services/chat-features.service')
const realtime = require('../../services/chat-socket.service')
const { action, authorizedRoom, recipientIds, messageView } = require('./chat.controller').access
const { positiveId } = require('../../services/chat-rules')
const fail = (status,message) => {throw Object.assign(new Error(message),{status})}
exports.Upload = action(async(req,res,user)=>{
 const room = await authorizedRoom(req.params.roomId,user.id)
 let name
 try { name=decodeURIComponent(req.get('X-File-Name') || '') } catch { fail(400,'Invalid file name.') }
 const metadata=inspectAttachment(name,req.body)
 const uploadId=req.get('X-Upload-Id')
 if(typeof uploadId!=='string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(uploadId)) fail(400,'A valid upload ID is required.')
 const hash=createHash('sha256').update(`${user.id}:${room.id}:${uploadId}`).digest('hex').slice(0,32)
 const id=`${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20)}`
 const file=await database.transaction(async transaction=>{
  await database.query('SELECT pg_advisory_xact_lock(:account)',{replacements:{account:user.id},transaction})
  const existing=await Attachment.findByPk(id,{transaction})
  if(existing) {
   if(existing.name!==metadata.name || !existing.content.equals(req.body)) fail(409,'Upload ID already used for another file.')
   return existing
  }
  const used=await Attachment.sum('size',{where:{owner_id:user.id},transaction}) || 0
  if(used+metadata.size>100*1024*1024) fail(413,'Your attachment storage limit of 100 MB has been reached.')
  return Attachment.create({id,room_id:room.id,owner_id:user.id,...metadata,content:req.body},{transaction})
 })
 res.status(201).json(features.attachmentView(file))
})
exports.Download = action(async(req,res,user)=>{
 if(!/^[a-f0-9-]{36}$/i.test(req.params.id)) fail(400,'Invalid attachment.')
 const attachment=await Attachment.findByPk(req.params.id,{attributes:['id','room_id','owner_id','name','mime','size']})
 if(!attachment) fail(404,'File not found.')
 await authorizedRoom(attachment.room_id,user.id)
 const linked=await Detail.findOne({where:{attachment_id:attachment.id}})
 if(!linked && attachment.owner_id!==user.id) fail(404,'File not found.')
 res.set({'Content-Type':attachment.mime,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store',
  'Content-Disposition':`attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(attachment.name)}`})
 const stored=await Attachment.findByPk(attachment.id,{attributes:['content']})
 res.send(stored.content)
})
exports.DiscardUpload = action(async(req,res,user)=>{
 if(!/^[a-f0-9-]{36}$/i.test(req.params.id)) fail(400,'Invalid attachment.')
 await database.transaction(async transaction=>{
  const file=await Attachment.findByPk(req.params.id,{transaction,lock:transaction.LOCK.UPDATE})
  if(!file || file.owner_id!==user.id) fail(404,'File not found.')
  if(await Detail.findOne({where:{attachment_id:file.id},transaction})) fail(409,'This file is already attached to a message.')
  await file.destroy({transaction})
 })
 res.json({success:true})
})
exports.Read = action(async(req,res,user)=>{
 const room=await authorizedRoom(req.params.roomId,user.id)
 const message=await Message.findOne({where:{id:positiveId(req.body.message_id),room_id:room.id}})
 if(!message) fail(404,'Message not found.')
 await database.query(`INSERT INTO tbl_chat_read (room_id,user_id,message_id,read_at) VALUES (:room,:user,:message,NOW())
 ON CONFLICT (room_id,user_id) DO UPDATE SET message_id=EXCLUDED.message_id,read_at=EXCLUDED.read_at
 WHERE tbl_chat_read.message_id < EXCLUDED.message_id`,{replacements:{room:room.id,user:user.id,message:message.id}})
 const receipt=await Receipt.findOne({where:{room_id:room.id,user_id:user.id},raw:true})
 realtime.notify(await recipientIds(room),'receipt',receipt)
 res.json(receipt)
})
exports.Pin = action(async(req,res,user)=>{
 const room=await authorizedRoom(req.params.roomId,user.id)
 const id=positiveId(req.params.messageId)
 if(typeof req.body.pinned!=='boolean') fail(400,'Choose pin or unpin.')
 const message=await Message.findOne({where:{id,room_id:room.id}})
 if(!message) fail(404,'Message not found.')
 const [detail]=await Detail.findOrCreate({where:{message_id:id},defaults:{}})
 await detail.update({pinned:req.body.pinned,pinned_by:req.body.pinned?user.id:null,pinned_at:req.body.pinned?new Date():null})
 const [payload]=await features.enrich([messageView(message,'')])
 realtime.notify(await recipientIds(room),'message_updated',{...payload,sender:undefined})
 realtime.notify(await recipientIds(room),'rooms_changed',{room_id:room.id})
 res.json({success:true})
})
