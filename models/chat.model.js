const { DataTypes } = require("sequelize");
const database = require("../utils/data/database");
const User = require('../models/user.model')

const Chat = database.define('tbl_chat', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    text: {
        type: DataTypes.STRING,
    },
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: new Date()
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
}, {
    timestamps: false,
    freezeTableName: true
})

Chat.belongsTo(User, { foreignKey: 'sender_id', as: 'sender', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })

module.exports = Chat