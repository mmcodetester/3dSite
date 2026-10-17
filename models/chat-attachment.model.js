const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')
const options = { timestamps: false, freezeTableName: true }
const Attachment = database.define(
    'tbl_chat_attachment',
    {
        id: { type: DataTypes.UUID, primaryKey: true },
        room_id: { type: DataTypes.INTEGER, allowNull: false },
        owner_id: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING(180), allowNull: false },
        mime: { type: DataTypes.STRING(100), allowNull: false },
        size: { type: DataTypes.INTEGER, allowNull: false },
        content: { type: DataTypes.BLOB, allowNull: false },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    options,
)

module.exports = Attachment
