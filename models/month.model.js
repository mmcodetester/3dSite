const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')

const Month = database.define('tbl_month', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    month_id: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        autoIncrement: false,
        allowNull: false
    },
    month_name: {
        type: DataTypes.STRING(250),
        allowNull: false
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    created_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: new Date()
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    updated_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    }
}, {
    freezeTableName: true,
    timestamps: false
})

module.exports = Month