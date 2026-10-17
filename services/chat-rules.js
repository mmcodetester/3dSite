function positiveId(value) {
    const id = Number(value)
    if (!Number.isSafeInteger(id) || id <= 0) throw Object.assign(new Error('Invalid ID.'), { status: 400 })
    return id
}
function roomInput(body, currentUserId) {
    if (!['group', 'direct'].includes(body.type)) throw Object.assign(new Error('Choose a group or individual chat.'), { status: 400 })
    if (!Array.isArray(body.member_ids) || body.member_ids.length > 100) throw Object.assign(new Error('Select up to 100 members.'), { status: 400 })
    const members = [...new Set([currentUserId, ...body.member_ids.map(positiveId)])].sort((a,b) => a-b)
    if (body.type === 'direct' && members.length !== 2) throw Object.assign(new Error('Select one other person.'), { status: 400 })
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (body.type === 'group' && (!name || name.length > 100 || members.length < 2)) throw Object.assign(new Error('Enter a group name (up to 100 characters) and select members.'), { status: 400 })
    return { members, name: body.type === 'group' ? name : null, direct_key: body.type === 'direct' ? members.join(':') : null }
}
function createPresenceTracker() {
    const connections = new Map()
    return {
        add(userId, socketId) {
            const sockets = connections.get(userId) || new Set()
            sockets.add(socketId)
            connections.set(userId, sockets)
        },
        remove(userId, socketId) {
            const sockets = connections.get(userId)
            if (!sockets) return
            sockets.delete(socketId)
            if (!sockets.size) connections.delete(userId)
        },
        ids: () => [...connections.keys()],
    }
}
module.exports = { positiveId, roomInput, createPresenceTracker }
