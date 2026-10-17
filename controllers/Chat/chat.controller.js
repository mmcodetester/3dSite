const RepositoryBase = require('../common/repository.base')
const { Op } = require('sequelize')
const database = require('../../utils/data/database')
const User = require('../../models/user.model')
const { Room, Member, Message } = require('../../models/chat-room.model')
const realtime = require('../../services/chat-socket.service')
const chatPush = require('../../services/chat-push.service')
const Device = require('../../models/chat-device.model')
const Detail = require('../../models/chat-message-detail.model')
const Attachment = require('../../models/chat-attachment.model')
const Receipt = require('../../models/chat-read.model')
const features = require('../../services/chat-features.service')
const { positiveId, roomInput } = require('../../services/chat-rules')

const messageRepo = new RepositoryBase(Message)
const attachmentRepo = new RepositoryBase(Attachment)
const detailRepo = new RepositoryBase(Detail)
const receiptRepo = new RepositoryBase(Receipt)
const userRepo = new RepositoryBase(User)
const roomRepo = new RepositoryBase(Room)
const memberRepo = new RepositoryBase(Member)
const deviceRepo = new RepositoryBase(Device)

const fail = (status, message) => {
    throw Object.assign(new Error(message), { status })
}
const action = handler => async (req, res) => {
    try {
        const user = await userRepo.findOne({
            where: { id: req.user.id, deleted: false },
            attributes: ['id', 'name'],
        })
        if (!user)
            return res
                .status(401)
                .json({ message: 'Your account is unavailable.' })
        await handler(req, res, user)
    } catch (error) {
        if (!error.status) console.error('Chat request failed:', error.message)
        res.status(error.status || 500).json({
            message: error.status
                ? error.message
                : 'Chat is unavailable. Please try again.',
        })
    }
}
async function authorizedRoom(id, userId) {
    const room = await roomRepo.findByPk(positiveId(id))
    if (!room) fail(404, 'Conversation not found.')
    if (
        room.type !== 'general' &&
        !(await memberRepo.findOne({
            where: { room_id: room.id, user_id: userId },
        }))
    ) {
        fail(403, 'You are not a member of this conversation.')
    }
    return room
}
async function recipientIds(room) {
    return room.type === 'general'
        ? null
        : (await memberRepo.findAll({ where: { room_id: room.id } })).map(
              member => member.user_id,
          )
}
async function roomView(room, userId) {
    const members =
        room.type === 'general'
            ? []
            : await memberRepo.findAll({ where: { room_id: room.id } })
    const users = members.length
        ? await userRepo.findAll({
              where: {
                  id: { [Op.in]: members.map(member => member.user_id) },
              },
              attributes: ['id', 'name', 'deleted'],
          })
        : []
    const other = users.find(user => user.id !== userId)
    const [latest] = await messageRepo.findAll({
        where: { room_id: room.id },
        order: [['id', 'DESC']],
        limit: 1,
    })
    const sender = latest
        ? users.find(person => person.id === latest.sender_id) ||
          (await userRepo.findOne({
              where: { id: latest.sender_id },
              attributes: ['id', 'name', 'deleted'],
          }))
        : null
    const reads = await receiptRepo.findAll({
        where: { room_id: room.id },
        attributes: ['user_id', 'message_id', 'read_at'],
        raw: true,
    })
    const pinnedDetails = await detailRepo.findAll({
        where: { pinned: true },
        attributes: ['message_id'],
    })
    const pinnedRows = pinnedDetails.length
        ? await messageRepo.findAll({
              where: {
                  room_id: room.id,
                  id: { [Op.in]: pinnedDetails.map(item => item.message_id) },
              },
              order: [['id', 'DESC']],
              limit: 50,
          })
        : []
    const pins = await features.enrich(
        pinnedRows.map(item => messageView(item, '')),
    )
    const [last] = latest
        ? await features.enrich([
              messageView(
                  latest,
                  sender && !sender.deleted ? sender.name : 'Deleted user',
              ),
          ])
        : []
    return {
        id: room.id,
        type: room.type,
        created_by: room.created_by,
        reads,
        pins,
        last_message: last || null,
        name:
            room.type === 'direct'
                ? other?.deleted
                    ? 'Deleted user'
                    : other?.name || 'Individual chat'
                : room.name,
        members: users.map(user => ({
            id: user.id,
            name: user.deleted ? 'Deleted user' : user.name,
        })),
    }
}
function messageView(message, sender) {
    return {
        server_id: message.id,
        room_id: message.room_id,
        sender_id: message.sender_id,
        sender,
        client_id: message.client_id,
        text: message.text,
        date: message.date,
    }
}
exports.Users = action(async (req, res, user) => {
    const online = new Set(realtime.onlineIds())
    const users = await userRepo.findAll({
        where: { deleted: false, id: { [Op.ne]: user.id } },
        attributes: ['id', 'name'],
        order: [['name', 'ASC']],
    })
    res.json(
        users.map(person => ({
            id: person.id,
            name: person.name,
            online: online.has(person.id),
        })),
    )
})
exports.Rooms = action(async (req, res, user) => {
    const memberships = await memberRepo.findAll({
        where: { user_id: user.id },
    })
    const rooms = await roomRepo.findAll({
        where: {
            [Op.or]: [
                { type: 'general' },
                {
                    id: {
                        [Op.in]: memberships.map(member => member.room_id),
                    },
                },
            ],
        },
        order: [['id', 'ASC']],
    })
    res.json(await Promise.all(rooms.map(room => roomView(room, user.id))))
})
exports.CreateRoom = action(async (req, res, user) => {
    const input = roomInput(req.body, user.id)
    const users = await userRepo.count({
        where: { id: { [Op.in]: input.members }, deleted: false },
    })
    if (users !== input.members.length)
        fail(400, 'One or more selected people are unavailable.')
    const room = await database.transaction(async transaction => {
        // findOrCreate handles simultaneous requests for the same individual conversation.
        const [createdRoom] =
            req.body.type === 'direct'
                ? await roomRepo.findOrCreate({
                      where: { direct_key: input.direct_key },
                      defaults: { type: 'direct', created_by: user.id },
                      transaction,
                  })
                : [
                      await roomRepo.create(
                          {
                              type: 'group',
                              name: input.name,
                              created_by: user.id,
                          },
                          { transaction },
                      ),
                  ]
        await memberRepo.bulkCreate(
            input.members.map(id => ({
                room_id: createdRoom.id,
                user_id: id,
            })),
            { transaction, ignoreDuplicates: true },
        )
        return createdRoom
    })
    realtime.notify(input.members, 'rooms_changed', { room_id: room.id })
    res.json(await roomView(room, user.id))
})
exports.GetAll = action(async (req, res, user) => {
    const room = await authorizedRoom(req.query.room_id, user.id)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 40, 1), 100)
    const forward = req.query.direction === 'forward'
    const where = { room_id: room.id }
    if (req.query.cursor)
        where.id = { [forward ? Op.gt : Op.lt]: positiveId(req.query.cursor) }
    const rows = await messageRepo.findAll({
        where,
        order: [['id', forward ? 'ASC' : 'DESC']],
        limit: limit + 1,
    })
    const more = rows.length > limit
    const selected = rows.slice(0, limit)
    if (!forward) selected.reverse()
    const users = selected.length
        ? await userRepo.findAll({
              where: {
                  id: {
                      [Op.in]: [...new Set(selected.map(row => row.sender_id))],
                  },
              },
              attributes: ['id', 'name', 'deleted'],
          })
        : []
    const names = new Map(
        users.map(person => [
            person.id,
            person.deleted ? 'Deleted user' : person.name,
        ]),
    )
    res.json({
        messages: await features.enrich(
            selected.map(row =>
                messageView(row, names.get(row.sender_id) || 'Deleted user'),
            ),
        ),
        has_more: more,
    })
})
exports.SendMessage = action(async (req, res, user) => {
    const room = await authorizedRoom(req.body.room_id, user.id)
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : ''
    const clientId = req.body.client_id
    if (
        (!text && !req.body.attachment_id) ||
        text.length > 4000 ||
        typeof clientId !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,80}$/.test(clientId)
    ) {
        fail(
            400,
            'Enter a message up to 4,000 characters with a valid message ID.',
        )
    }
    const replyId =
        req.body.reply_to_id == null ? null : positiveId(req.body.reply_to_id)
    const attachmentId = req.body.attachment_id || null
    if (
        attachmentId &&
        (typeof attachmentId !== 'string' ||
            !/^[a-f0-9-]{36}$/i.test(attachmentId))
    )
        fail(400, 'Invalid attachment.')
    const [message, created] = await database.transaction(async transaction => {
        if (
            replyId &&
            !(await messageRepo.findOne({
                where: { id: replyId, room_id: room.id },
                transaction,
            }))
        )
            fail(400, 'Reply message is not in this conversation.')
        const attachment = attachmentId
            ? await attachmentRepo.findByPk(attachmentId, {
                  transaction,
                  lock: transaction.LOCK.UPDATE,
              })
            : null
        if (
            attachmentId &&
            (!attachment ||
                attachment.owner_id !== user.id ||
                attachment.room_id !== room.id)
        )
            fail(403, 'Attachment is not available in this conversation.')
        const [saved, isNew] = await messageRepo.findOrCreate({
            where: { sender_id: user.id, client_id: clientId },
            defaults: { room_id: room.id, text, date: new Date() },
            transaction,
        })
        if (saved.room_id !== room.id || saved.text !== text)
            fail(409, 'This message ID has already been used.')
        if (attachmentId) {
            const linked = await detailRepo.findOne({
                where: { attachment_id: attachmentId },
                transaction,
            })
            if (linked && linked.message_id !== saved.id)
                fail(409, 'This attachment is already used by another message.')
        }
        const [detail] = await detailRepo.findOrCreate({
            where: { message_id: saved.id },
            defaults: { reply_to_id: replyId, attachment_id: attachmentId },
            transaction,
        })
        if (
            (detail.reply_to_id || null) !== replyId ||
            (detail.attachment_id || null) !== attachmentId
        )
            fail(409, 'This message ID has already been used.')
        return [saved, isNew]
    })
    const [payload] = await features.enrich([messageView(message, user.name)])
    const recipients = await recipientIds(room)
    realtime.notify(recipients, 'message', payload)
    if (created)
        void chatPush
            .sendChatPush(payload, recipients, room)
            .catch(error =>
                console.error(
                    'Chat push unavailable:',
                    error.code || error.name,
                ),
            )
    res.json({ success: true, ...payload })
})
const lastTyping = new Map()
exports.SendTypingEvent = action(async (req, res, user) => {
    const room = await authorizedRoom(req.body.room_id, user.id)
    const now = Date.now()
    if (now - (lastTyping.get(user.id) || 0) >= 1000) {
        lastTyping.set(user.id, now)
        realtime.notify(await recipientIds(room), 'typing', {
            room_id: room.id,
            sender_id: user.id,
            sender: user.name,
        })
    }
    res.json({ success: true })
})

exports.RegisterDevice = action(async (req, res, user) => {
    const { installation_id, token } = req.body
    if (
        typeof installation_id !== 'string' ||
        !/^[a-zA-Z0-9_-]{16,80}$/.test(installation_id) ||
        typeof token !== 'string' ||
        token.length < 20 ||
        token.length > 4096 ||
        /\s/.test(token)
    ) {
        fail(400, 'Invalid notification device.')
    }
    await database.transaction(async transaction => {
        // A refreshed token replaces this installation's old token; switching accounts replaces its owner.
        await deviceRepo.destroy({
            where: { token, installation_id: { [Op.ne]: installation_id } },
            transaction,
        })
        await deviceRepo.upsert(
            {
                user_id: user.id,
                installation_id,
                token,
                updated_at: new Date(),
            },
            { transaction, conflictFields: ['installation_id'] },
        )
    })
    res.json({ success: true, push_configured: chatPush.isConfigured() })
})
exports.UnregisterDevice = action(async (req, res, user) => {
    const installationId = req.body.installation_id
    if (
        typeof installationId !== 'string' ||
        !/^[a-zA-Z0-9_-]{16,80}$/.test(installationId)
    )
        fail(400, 'Invalid notification device.')
    await deviceRepo.destroy({
        where: { user_id: user.id, installation_id: installationId },
    })
    res.json({ success: true })
})

exports.access = { action, authorizedRoom, recipientIds, messageView }
