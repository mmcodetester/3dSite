const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')
const options = { timestamps: false, freezeTableName: true }
const Detail = database.define(
    'tbl_chat_message_detail',
    {
        message_id: { type: DataTypes.INTEGER, primaryKey: true },
        reply_to_id: DataTypes.INTEGER,
        attachment_id: { type: DataTypes.UUID, unique: true },
        pinned: { type: DataTypes.BOOLEAN, defaultValue: false },
        pinned_by: DataTypes.INTEGER,
        pinned_at: DataTypes.DATE,
    },
    options,
)

module.exports = Detail
