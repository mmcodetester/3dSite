const RepositoryBase = require('../common/repository.base')
const Deletion = require('../../models/chat-message-deletion.model')
const { createHash } = require('node:crypto')
const database = require('../../utils/data/database')
const { Message } = require('../../models/chat-room.model')
const Detail = require('../../models/chat-message-detail.model')
const Attachment = require('../../models/chat-attachment.model')
const Receipt = require('../../models/chat-read.model')
const { inspectAttachment } = require('../../services/chat-attachment-rules')
const features = require('../../services/chat-features.service')
const realtime = require('../../services/chat-socket.service')
const { action, authorizedRoom, recipientIds, messageView } =
    require('./chat.controller').access
const { positiveId } = require('../../services/chat-rules')
const messageRepo = new RepositoryBase(Message)
const attachmentRepo = new RepositoryBase(Attachment)
const detailRepo = new RepositoryBase(Detail)
const receiptRepo = new RepositoryBase(Receipt)
const deletionRepo = new RepositoryBase(Deletion)

const fail = (status, message) => {
    throw Object.assign(new Error(message), { status })
}
exports.Upload = action(async (req, res, user) => {
    const room = await authorizedRoom(req.params.roomId, user.id)
    let name
    try {
        name = decodeURIComponent(req.get('X-File-Name') || '')
    } catch {
        fail(400, 'Invalid file name.')
    }
    const metadata = inspectAttachment(name, req.body)
    const uploadId = req.get('X-Upload-Id')
    if (typeof uploadId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(uploadId))
        fail(400, 'A valid upload ID is required.')
    const hash = createHash('sha256')
        .update(`${user.id}:${room.id}:${uploadId}`)
        .digest('hex')
        .slice(0, 32)
    const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`
    const file = await database.transaction(async transaction => {
        await database.query('SELECT pg_advisory_xact_lock(:account)', {
            replacements: { account: user.id },
            transaction,
        })
        const existing = await attachmentRepo.findByPk(id, { transaction })
        if (existing) {
            if (
                existing.name !== metadata.name ||
                !existing.content.equals(req.body)
            )
                fail(409, 'Upload ID already used for another file.')
            return existing
        }
        const used =
            (await attachmentRepo.sum('size', {
                where: { owner_id: user.id },
                transaction,
            })) || 0
        if (used + metadata.size > 100 * 1024 * 1024)
            fail(
                413,
                'Your attachment storage limit of 100 MB has been reached.',
            )
        return attachmentRepo.create(
            {
                id,
                room_id: room.id,
                owner_id: user.id,
                ...metadata,
                content: req.body,
            },
            { transaction },
        )
    })
    res.status(201).json(features.attachmentView(file))
})
exports.Download = action(async (req, res, user) => {
    if (!/^[a-f0-9-]{36}$/i.test(req.params.id))
        fail(400, 'Invalid attachment.')
    const attachment = await attachmentRepo.findByPk(req.params.id, {
        attributes: ['id', 'room_id', 'owner_id', 'name', 'mime', 'size'],
    })
    if (!attachment) fail(404, 'File not found.')
    await authorizedRoom(attachment.room_id, user.id)
    const linked = await detailRepo.findOne({
        where: { attachment_id: attachment.id },
    })
    if (linked && (await deletionRepo.findByPk(linked.message_id)))
        fail(404, 'File not found.')
    if (!linked && attachment.owner_id !== user.id) fail(404, 'File not found.')
    res.set({
        'Content-Type': attachment.mime,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
    })
    const stored = await attachmentRepo.findByPk(attachment.id, {
        attributes: ['content'],
    })
    res.send(stored.content)
})
exports.DiscardUpload = action(async (req, res, user) => {
    if (!/^[a-f0-9-]{36}$/i.test(req.params.id))
        fail(400, 'Invalid attachment.')
    await database.transaction(async transaction => {
        const file = await attachmentRepo.findByPk(req.params.id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        })
        if (!file || file.owner_id !== user.id) fail(404, 'File not found.')
        if (
            await detailRepo.findOne({
                where: { attachment_id: file.id },
                transaction,
            })
        )
            fail(409, 'This file is already attached to a message.')
        await file.destroy({ transaction })
    })
    res.json({ success: true })
})
exports.Read = action(async (req, res, user) => {
    const room = await authorizedRoom(req.params.roomId, user.id)
    const message = await messageRepo.findOne({
        where: { id: positiveId(req.body.message_id), room_id: room.id },
    })
    if (!message) fail(404, 'Message not found.')
    await database.query(
        `INSERT INTO tbl_chat_read (room_id,user_id,message_id,read_at) VALUES (:room,:user,:message,NOW())
 ON CONFLICT (room_id,user_id) DO UPDATE SET message_id=EXCLUDED.message_id,read_at=EXCLUDED.read_at
 WHERE tbl_chat_read.message_id < EXCLUDED.message_id`,
        { replacements: { room: room.id, user: user.id, message: message.id } },
    )
    const receipt = await receiptRepo.findOne({
        where: { room_id: room.id, user_id: user.id },
        raw: true,
    })
    realtime.notify(await recipientIds(room), 'receipt', receipt)
    res.json(receipt)
})
exports.Pin = action(async (req, res, user) => {
    const room = await authorizedRoom(req.params.roomId, user.id)
    const id = positiveId(req.params.messageId)
    if (typeof req.body.pinned !== 'boolean') fail(400, 'Choose pin or unpin.')
    const message = await database.transaction(async transaction => {
        const existing = await messageRepo.findOne({
            where: { id, room_id: room.id },
            transaction,
            lock: transaction.LOCK.UPDATE,
        })
        if (!existing) fail(404, 'Message not found.')
        if (await deletionRepo.findByPk(id, { transaction }))
            fail(409, 'Deleted messages cannot be pinned.')
        const [detail] = await detailRepo.findOrCreate({
            where: { message_id: id },
            defaults: {},
            transaction,
        })
        await detail.update(
            {
                pinned: req.body.pinned,
                pinned_by: req.body.pinned ? user.id : null,
                pinned_at: req.body.pinned ? new Date() : null,
            },
            { transaction },
        )
        return existing
    })
    const [payload] = await features.enrich([messageView(message, '')])
    realtime.notify(await recipientIds(room), 'message_updated', {
        ...payload,
        sender: undefined,
    })
    realtime.notify(await recipientIds(room), 'rooms_changed', {
        room_id: room.id,
    })
    res.json({ success: true })
})

exports.Deletions = action(async (req, res, user) => {
    const room = await authorizedRoom(req.params.roomId, user.id)
    const rows = await deletionRepo.findAll({
        where: { room_id: room.id },
        raw: true,
    })
    res.json(rows)
})

exports.Delete = action(async (req, res, user) => {
    const room = await authorizedRoom(req.params.roomId, user.id)
    const id = positiveId(req.params.messageId)
    const message = await database.transaction(async transaction => {
        const existing = await messageRepo.findOne({
            where: { id, room_id: room.id },
            transaction,
            lock: transaction.LOCK.UPDATE,
        })
        if (!existing) fail(404, 'Message not found.')
        if (existing.sender_id !== user.id)
            fail(403, 'You can only delete your own messages.')
        await deletionRepo.findOrCreate({
            where: { message_id: id },
            defaults: { room_id: room.id, deleted_by: user.id },
            transaction,
        })
        await existing.update({ text: 'Deleted Message' }, { transaction })
        await detailRepo.update(
            { pinned: false, pinned_by: null, pinned_at: null },
            {
                where: { message_id: id },
                transaction,
            },
        )
        return existing
    })
    const [payload] = await features.enrich([messageView(message, user.name)])
    const recipients = await recipientIds(room)
    realtime.notify(recipients, 'message_updated', payload)
    realtime.notify(recipients, 'rooms_changed', { room_id: room.id })
    res.json(payload)
})
