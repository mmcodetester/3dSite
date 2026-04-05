const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')

const OtherAmontReport = database.define('tbl_other_amount_report',{
    id :{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement : true,
        allowNull : false
    },
    number_id:{
        type: DataTypes.INTEGER,
        allowNull : true
    },
    number :{
        type: DataTypes.STRING,
        allowNull : true
    },
    monthly_amount_id :{
        type : DataTypes.INTEGER,
        allowNull : false
    },
    total_amount :{
        type : DataTypes.INTEGER,
        allowNull : false
    },
    total_extra :{
        type : DataTypes.INTEGER,
        allowNull : true,
        defaultValue : null
    },
    month_name :{
        type: DataTypes.STRING,
        allowNull : true
    },
    year :{
        type: DataTypes.INTEGER,
        allowNull : true
    },
    from_to :{
        type: DataTypes.STRING,
        allowNull : true
    },
},{
    freezeTableName: true,
    timestamps : false
})

module.exports = OtherAmontReport;