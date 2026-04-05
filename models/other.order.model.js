const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')
const User = require('./user.model')
const Number = require('./number.model')
const MonthlyAmount = require('./monthly.amount')
const OtherOrder = database.define('tbl_other_order',{
    id :{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement : true,
        allowNull : false
    },
    number_id :{
        type: DataTypes.INTEGER,
        allowNull : false
    },
    monthly_amount_id :{
        type : DataTypes.INTEGER,
        allowNull : false
    },
    amount :{
        type : DataTypes.INTEGER,
        allowNull : false
    },
    extra :{
        type : DataTypes.INTEGER,
        allowNull : true,
        defaultValue : null
    },
    deleted :{
        type : DataTypes.BOOLEAN,
        defaultValue : false,
        allowNull : false
    },
    created_date :{
        type : DataTypes.DATEONLY,
        defaultValue : new Date(),
        allowNull : false
    },
    created_by :{
        type : DataTypes.INTEGER,
        allowNull : true,
        defaultValue : null
    }
}, {
    timestamps: false,
    freezeTableName : true
})

OtherOrder.belongsTo(Number,{ foreignKey:'number_id', as:'number', onDelete:'NO ACTION', onUpdate:'NO ACTION'} )
OtherOrder.belongsTo(MonthlyAmount, { foreignKey:'monthly_amount_id', as:'monthly_amount', onDelete:'NO ACTION', onUpdate:'NO ACTION'})
OtherOrder.belongsTo(User, { foreignKey: 'created_by', as:'user', onDelete:'NO ACTION', onUpdate:'NO ACTION'})

module.exports = OtherOrder