const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')
const Month = require('./month.model')
const Number = require('./number.model')
const User = require('./user.model')
const MonthlyAmount = require('./monthly.amount')

const Order = database.define('tbl_order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    number_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    month_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    monthly_amount_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue : 0
    },
    date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: new Date()
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

Order.belongsTo(Month, {foreignKey:'month_id', as:'month', onDelete:'NO ACTION', onUpdate:'NO ACTION'})
Order.belongsTo(Number, {foreignKey:'number_id', as:'number', onDelete:'NO ACTION', onUpdate:'NO ACTION'})
Order.belongsTo(User, {foreignKey:'created_by', as:'user', onDelete:'NO ACTION', onUpdate:'NO ACTION'})
Order.belongsTo(MonthlyAmount , {foreignKey:'monthly_amount_id', as:'monthly_amount', onDelete:'NO ACTION', onUpdate:'NO ACTION'})

module.exports = Order