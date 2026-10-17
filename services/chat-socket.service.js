const jwt = require('jsonwebtoken')
const User = require('../models/user.model')
const { createPresenceTracker } = require('./chat-rules')
const presence = createPresenceTracker()
let chatIO
exports.init = io => {
    chatIO = io.of('/chat')
    chatIO.use(async (socket, next) => {
        try {
            const payload = jwt.verify(socket.handshake.auth?.token, process.env.SECRET_KEY)
            const user = await User.findOne({ where: { id: payload.id, deleted: false }, attributes: ['id', 'name'] })
            if (!user) return next(new Error('Unauthorized'))
            socket.data.user = user
            socket.data.expiresAt = payload.exp * 1000
            next()
        } catch { next(new Error('Unauthorized')) }
    })
    chatIO.on('connection', socket => {
        const userId = socket.data.user.id
        socket.join(`user:${userId}`)
        presence.add(userId, socket.id)
        chatIO.emit('presence', presence.ids())
        const timer = setTimeout(() => socket.disconnect(true), Math.max(0, socket.data.expiresAt - Date.now()))
        socket.on('disconnect', () => {
            clearTimeout(timer)
            presence.remove(userId, socket.id)
            chatIO.emit('presence', presence.ids())
        })
    })
}
exports.onlineIds = () => presence.ids()
exports.notify = (userIds, event, payload) => {
    if (!chatIO) return
    if (userIds === null) chatIO.emit(event, payload)
    else chatIO.to(userIds.map(id => `user:${id}`)).emit(event, payload)
}
