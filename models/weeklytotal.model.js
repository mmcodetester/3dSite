const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')

const WeeklyTotal = database.define('tbl_weekly_amount_total', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    number: {
        type: DataTypes.STRING,
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
    monthly_amount_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    from_to: {
        type: DataTypes.STRING(250),
        allowNull: false
    },
}, {
    timestamps: false,
    freezeTableName: true
})

module.exports = WeeklyTotal