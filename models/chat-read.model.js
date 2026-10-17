const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')
const options = { timestamps: false, freezeTableName: true }
const Receipt = database.define(
    'tbl_chat_read',
    {
        room_id: { type: DataTypes.INTEGER, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, primaryKey: true },
        message_id: { type: DataTypes.INTEGER, allowNull: false },
        read_at: { type: DataTypes.DATE, allowNull: false },
    },
    options,
)

module.exports = Receipt
