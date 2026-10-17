const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')
const options = { timestamps: false, freezeTableName: true }
const Attachment = database.define('tbl_chat_attachment', {
 id: { type: DataTypes.UUID, primaryKey: true }, room_id: { type: DataTypes.INTEGER, allowNull: false },
 owner_id: { type: DataTypes.INTEGER, allowNull: false }, name: { type: DataTypes.STRING(180), allowNull: false },
 mime: { type: DataTypes.STRING(100), allowNull: false }, size: { type: DataTypes.INTEGER, allowNull: false },
 content: { type: DataTypes.BLOB, allowNull: false }, created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, options)
const Detail = database.define('tbl_chat_message_detail', {
 message_id: { type: DataTypes.INTEGER, primaryKey: true }, reply_to_id: DataTypes.INTEGER,
 attachment_id: { type: DataTypes.UUID, unique: true }, pinned: { type: DataTypes.BOOLEAN, defaultValue: false },
 pinned_by: DataTypes.INTEGER, pinned_at: DataTypes.DATE,
}, options)
const Receipt = database.define('tbl_chat_read', {
 room_id: { type: DataTypes.INTEGER, primaryKey: true }, user_id: { type: DataTypes.INTEGER, primaryKey: true },
 message_id: { type: DataTypes.INTEGER, allowNull: false }, read_at: { type: DataTypes.DATE, allowNull: false },
}, options)
module.exports = { Attachment, Detail, Receipt }
