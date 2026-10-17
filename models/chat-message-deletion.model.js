const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')

const ChatMessageDeletion = database.define(
    'tbl_chat_message_deletion',
    {
        message_id: { type: DataTypes.INTEGER, primaryKey: true },
        room_id: { type: DataTypes.INTEGER, allowNull: false },
        deleted_by: { type: DataTypes.INTEGER, allowNull: false },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
        indexes: [{ fields: ['room_id'] }],
    },
)

module.exports = ChatMessageDeletion
