const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const mocks = {
    '../models/chat-message-detail.model': {
        findAll: async () => [
            { message_id: 10, attachment_id: 'file', pinned: true },
            { message_id: 20, reply_to_id: 10 },
        ],
    },
    '../models/chat-attachment.model': {
        findAll: async () => [
            {
                id: 'file',
                room_id: 2,
                name: 'private.pdf',
                mime: 'application/pdf',
                size: 10,
            },
        ],
    },
    '../models/chat-message-deletion.model': {
        findAll: async () => [{ message_id: 10, room_id: 2 }],
    },
    '../models/chat-room.model': {
        Message: {
            findAll: async () => [
                {
                    id: 10,
                    room_id: 2,
                    sender_id: 1,
                    text: 'Stale private content',
                },
            ],
        },
    },
    '../models/user.model': {
        findAll: async () => [{ id: 1, name: 'Sender', deleted: false }],
    },
}
for (const [relative, exports] of Object.entries(mocks)) {
    const filename = require.resolve(path.join(__dirname, relative))
    require.cache[filename] = { id: filename, filename, loaded: true, exports }
}
const { enrich } = require('../services/chat-features.service')

test('enrichment masks deleted content, attachments, pins, and quoted originals', async () => {
    const [deleted, reply] = await enrich([
        { server_id: 10, room_id: 2, text: 'Stale private content' },
        { server_id: 20, room_id: 2, text: 'A reply' },
    ])
    assert.equal(deleted.text, 'Deleted Message')
    assert.equal(deleted.deleted, true)
    assert.equal(deleted.attachment, null)
    assert.equal(deleted.reply_to, null)
    assert.equal(deleted.pinned, false)
    assert.equal(reply.reply_to.text, 'Deleted Message')
    assert.equal(reply.text, 'A reply')
})
