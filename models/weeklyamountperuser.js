const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')
const MonthlyAmount = require('./monthly.amount')


const WeeklyAmountPerUser = database.define('tbl_weekly_amount_per_user',{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    monthly_amount_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    from_to: {
        type: DataTypes.STRING(250),
        allowNull: false
    },
    total_amount: {
        type: DataTypes.INTEGER,
        primaryKey: false,
        autoIncrement: false,
        allowNull: true
    },
    name: {
        type: DataTypes.STRING(250),
        allowNull: false
    },
    username: {
        type: DataTypes.STRING(250),
        allowNull: false
    },
},{
    timestamps : false,
    freezeTableName : true
})

WeeklyAmountPerUser.belongsTo(MonthlyAmount, {foreignKey:'monthly_amount_id', as:'monthly_amount', onDelete:'NO ACTION', onUpdate:'NO ACTION'})

module.exports = WeeklyAmountPerUser