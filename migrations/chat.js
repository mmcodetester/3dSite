// Explicit migration: uses the DB_URL configured for this environment.
const fs = require('node:fs')
const path = require('node:path')
const database = require('../utils/data/database')
;(async () => {
    try {
        await database.query(fs.readFileSync(path.join(__dirname, '001-chat-rooms.sql'), 'utf8'))
        await database.query(fs.readFileSync(path.join(__dirname, '002-chat-notifications.sql'), 'utf8'))
        console.log('Chat rooms and notification device migrations complete. Existing messages are in General.')
    } catch (error) {
        console.error('Chat migration failed:', error.message)
        process.exitCode = 1
    } finally { await database.close() }
})()

