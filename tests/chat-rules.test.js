const test = require('node:test')
const assert = require('node:assert/strict')
const { roomInput, positiveId, createPresenceTracker } = require('../services/chat-rules')
test('individual chats normalize the participant pair and always include the current user', () => {
    assert.deepEqual(roomInput({ type: 'direct', member_ids: [9, 9] }, 2), { members: [2,9], name: null, direct_key: '2:9' })
    assert.equal(roomInput({ type: 'direct', member_ids: [2] }, 9).direct_key, '2:9')
    for (const ids of [[], [2], [9,10]]) assert.throws(() => roomInput({ type: 'direct', member_ids: ids }, 2), { status: 400 })
})
test('groups require a name, another member, valid IDs, and a bounded member list', () => {
    assert.deepEqual(roomInput({ type: 'group', name: '  Team  ', member_ids: [3,3] }, 2), { members: [2,3], name: 'Team', direct_key: null })
    for (const body of [
        { type: 'general', member_ids: [3] }, { type: 'group', name: '', member_ids: [3] },
        { type: 'group', name: 'x'.repeat(101), member_ids: [3] }, { type: 'group', name: 'Team', member_ids: [] },
        { type: 'group', name: 'Team', member_ids: [0] }, { type: 'group', name: 'Team', member_ids: Array(101).fill(3) },
    ]) assert.throws(() => roomInput(body, 2), { status: 400 })
    for (const id of [-1, 0, null, '', 'abc', 1.5, Infinity]) assert.throws(() => positiveId(id), { status: 400 })
})
test('presence remains online until the last tab or device disconnects', () => {
    const tracker = createPresenceTracker()
    tracker.add(2, 'tab-a'); tracker.add(2, 'tab-b'); tracker.add(3, 'phone')
    tracker.remove(2, 'tab-a')
    assert.deepEqual(tracker.ids().sort(), [2,3])
    tracker.remove(2, 'tab-b'); tracker.remove(2, 'unknown')
    assert.deepEqual(tracker.ids(), [3])
    tracker.remove(3, 'phone')
    assert.deepEqual(tracker.ids(), [])
})
