const { Op } = require('sequelize')
const Device = require('../models/chat-device.model')
const User = require('../models/user.model')
let messaging
exports.isConfigured = () => process.env.CHAT_PUSH_ENABLED === 'true'
function getMessaging() {
    if (!exports.isConfigured()) return null
    if (!messaging) {
        const { initializeApp, applicationDefault, getApps } = require('firebase-admin/app')
        const { getMessaging: getFirebaseMessaging } = require('firebase-admin/messaging')
        const app = getApps().find(item => item.name === 'chat-push') || initializeApp({
            credential: applicationDefault(),
            ...(process.env.FIREBASE_PROJECT_ID ? { projectId: process.env.FIREBASE_PROJECT_ID } : {}),
        }, 'chat-push')
        messaging = getFirebaseMessaging(app)
    }
    return messaging
}
exports.sendChatPush = async (message, recipientIds, room) => {
    const client = getMessaging()
    if (!client) return
    const where = { deleted: false, id: { [Op.ne]: message.sender_id } }
    if (recipientIds !== null) where.id = { [Op.in]: recipientIds.filter(id => id !== message.sender_id) }
    const users = await User.findAll({ where, attributes: ['id'] })
    if (!users.length) return
    const devices = await Device.findAll({ where: { user_id: { [Op.in]: users.map(user => user.id) } } })
    for (let offset = 0; offset < devices.length; offset += 500) {
        const batch = devices.slice(offset, offset + 500)
        const title = room.type === 'direct' ? message.sender : `${message.sender} · ${room.name}`
        // Use notification + data, rather than data-only: Android can display this with JS closed.
        // Each account has its own data payload so a notification cannot open another account's room.
        const responses = await client.sendEach(batch.map(device => ({
            token: device.token,
            notification: { title, body: (message.text || (message.attachment ? 'Attachment: '+message.attachment.name : 'New message')).slice(0, 200) },
            data: { type: 'chat', room_id: String(message.room_id), account_id: String(device.user_id),
                message_id: String(message.server_id), sender_id: String(message.sender_id), sender: message.sender,
                text: message.text.slice(0, 200), room_name: room.name || '', room_type: room.type },
            android: { priority: 'high', ttl: 24 * 60 * 60 * 1000,
                notification: { channelId: 'chat-messages', tag: `chat-${device.user_id}-${message.room_id}-${message.server_id}`, sound: 'default', visibility: 'private', icon: 'ic_chat_notification' } },
        })))
        const invalid = []
        responses.responses.forEach((result, index) => {
            if (['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(result.error?.code)) {
                invalid.push(batch[index].id)
            } else if (!result.success) console.error('Chat push delivery failed:', result.error?.code || 'unknown')
        })
        if (invalid.length) await Device.destroy({ where: { id: { [Op.in]: invalid } } })
    }
}


