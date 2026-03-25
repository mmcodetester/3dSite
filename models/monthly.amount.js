const database = require('../utils/data/database')
const Month = require('./month.model')
const {DataTypes} = require('sequelize')
const MonthlyAmount = database.define('tbl_monthly_amount', {
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
    amount: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        autoIncrement: false,
        allowNull: false
    },
    from_day: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        autoIncrement: false,
        allowNull: false
    },
    to_day: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        autoIncrement: false,
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    amount: {
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

MonthlyAmount.belongsTo(Month, {foreignKey:'month_id', as:'month', onDelete:'NO ACTION', onUpdate:'NO ACTION'})

module.exports = MonthlyAmount