const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')
const Number = database.define('tbl_number',{
        id:{
            type: DataTypes.INTEGER,
            primaryKey:true,
            allowNull:false,
            autoIncrement:true
        },
        number:{
            type : DataTypes.STRING(255),
            allowNull:false
        },
        deleted:{
            type : DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue : false
        },
        created_date:{
            type: DataTypes.DATEONLY,
            allowNull : true,
            defaultValue : new Date()
        },
        created_by:{
            type: DataTypes.INTEGER,
            allowNull : true,
            defaultValue : 0
        },
        updated_date:{
            type: DataTypes.DATEONLY,
            allowNull : true,
            defaultValue : null
        },
        updated_by:{
            type: DataTypes.INTEGER,
            allowNull : true,
            defaultValue : 0
        }   
}, {
    freezeTableName : true,
    timestamps: false
})

module.exports = Number