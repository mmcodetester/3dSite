const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')
const options = { timestamps: false, freezeTableName: true }
const Room = database.define('tbl_chat_room', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.STRING(10), allowNull: false },
    name: DataTypes.STRING(100),
    direct_key: { type: DataTypes.STRING(80), unique: true },
    created_by: DataTypes.INTEGER,
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, options)
const Member = database.define('tbl_chat_member', {
    room_id: { type: DataTypes.INTEGER, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, primaryKey: true },
}, options)
const Message = database.define('tbl_chat_message', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    room_id: { type: DataTypes.INTEGER, allowNull: false },
    sender_id: { type: DataTypes.INTEGER, allowNull: false },
    client_id: { type: DataTypes.STRING(80), allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
    date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { ...options, indexes: [{ name: 'chat_message_sender_client', unique: true, fields: ['sender_id', 'client_id'] }] })
module.exports = { Room, Member, Message }


