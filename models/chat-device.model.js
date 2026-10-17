const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')
module.exports = database.define('tbl_chat_device', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    installation_id: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    token: { type: DataTypes.TEXT, allowNull: false, unique: true },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { timestamps: false, freezeTableName: true })
