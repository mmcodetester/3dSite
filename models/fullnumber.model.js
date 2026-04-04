const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')

const FullNumber = database.define('tbl_full_number', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    number_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    number: {
        type: DataTypes.STRING(250),
        allowNull: false
    },
    total: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        autoIncrement: false,
        allowNull: true
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
}, {
    freezeTableName: true,
    timestamps: false
})

module.exports = FullNumber