const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')
const Month = require('./month.model')

const MonthlyTotal = database.define('tbl_monthly_total', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        autoIncrement: false,
        allowNull: false
    },
    month_id: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        autoIncrement: false,
        allowNull: false
    },
    total_amount: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        autoIncrement: false,
        allowNull: false
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
MonthlyTotal.belongsTo(Month, {foreignKey:'month_id', as:'month', onDelete:'NO ACTION', onUpdate:'NO ACTION'})

module.exports = MonthlyTotal