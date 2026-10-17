const { Op } = require('sequelize')
const Detail = require('../models/chat-message-detail.model')
const Attachment = require('../models/chat-attachment.model')
const Deletion = require('../models/chat-message-deletion.model')
const { Message } = require('../models/chat-room.model')
const User = require('../models/user.model')
const attachmentView = item =>
    item
        ? { id: item.id, name: item.name, mime: item.mime, size: item.size }
        : null
async function enrich(payloads) {
    if (!payloads.length) return payloads
    const details = await Detail.findAll({
        where: {
            message_id: { [Op.in]: payloads.map(item => item.server_id) },
        },
        raw: true,
    })
    const replyIds = details.map(item => item.reply_to_id).filter(Boolean)
    const replies = replyIds.length
        ? await Message.findAll({
              where: { id: { [Op.in]: replyIds } },
              raw: true,
          })
        : []
    const deletions = await Deletion.findAll({
        where: {
            message_id: {
                [Op.in]: [...payloads.map(item => item.server_id), ...replyIds],
            },
        },
        raw: true,
    })
    const deletedIds = new Set(deletions.map(item => item.message_id))
    const attachmentIds = details
        .map(item => item.attachment_id)
        .filter(Boolean)
    const attachments = attachmentIds.length
        ? await Attachment.findAll({
              where: { id: { [Op.in]: attachmentIds } },
              attributes: ['id', 'room_id', 'name', 'mime', 'size'],
              raw: true,
          })
        : []
    const users = replies.length
        ? await User.findAll({
              where: { id: { [Op.in]: replies.map(item => item.sender_id) } },
              attributes: ['id', 'name', 'deleted'],
              raw: true,
          })
        : []
    return payloads.map(payload => {
        const detail = details.find(
            item => item.message_id === payload.server_id,
        )
        const reply = replies.find(
            item =>
                item.id === detail?.reply_to_id &&
                item.room_id === payload.room_id,
        )
        const person = reply && users.find(item => item.id === reply.sender_id)
        const attachment = attachments.find(
            item =>
                item.id === detail?.attachment_id &&
                item.room_id === payload.room_id,
        )
        if (deletedIds.has(payload.server_id))
            return {
                ...payload,
                text: 'Deleted Message',
                deleted: true,
                reply_to: null,
                attachment: null,
                pinned: false,
                pinned_by: null,
            }
        return {
            ...payload,
            deleted: false,
            reply_to: reply
                ? {
                      server_id: reply.id,
                      sender:
                          person && !person.deleted
                              ? person.name
                              : 'Deleted user',
                      text: deletedIds.has(reply.id)
                          ? 'Deleted Message'
                          : reply.text,
                  }
                : null,
            attachment: attachmentView(attachment),
            pinned: Boolean(detail?.pinned),
            pinned_by: detail?.pinned_by || null,
        }
    })
}
module.exports = { enrich, attachmentView }
