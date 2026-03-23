const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')
const datebase = require('../utils/data/database')

const DailyTotal = database.define('tbl_daily_total', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    order_count: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        autoIncrement: false,
        allowNull: true
    },
    number: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        autoIncrement: false,
        allowNull: true
    },
    total_amount: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        autoIncrement: false,
        allowNull: true
    },
    month_id: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        autoIncrement: false,
        allowNull: true
    },
    month_name: {
        type: DataTypes.STRING(250),
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        autoIncrement: false,
        allowNull: true
    },
    created_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null
    },
}, {
    timestamps: false,
    freezeTableName: true
})

module.exports = DailyTotal