// Explicit additive migration for the new chat features only. Never runs on import.
const fs = require('node:fs')
const path = require('node:path')
const database = require('../utils/data/database')
;(async () => {
 try {
  await database.query(fs.readFileSync(path.join(__dirname, '003-chat-features.sql'), 'utf8'))
  console.log('Reply, seen, pin, and attachment tables are ready. Existing data preserved.')
 } catch (error) {
  console.error('Chat feature migration failed:',error.message)
  process.exitCode = 1
 } finally { await database.close() }
})()
