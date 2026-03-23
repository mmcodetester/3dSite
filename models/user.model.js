const { DataTypes } = require('sequelize')
const database = require('../utils/data/database')
const User = database.define('tbl_user',{
        id:{
            type: DataTypes.INTEGER,
            primaryKey:true,
            allowNull:false,
            autoIncrement:true
        },
        name:{
            type : DataTypes.STRING(255),
            allowNull:false
        },
        username:{
            type : DataTypes.STRING(255),
            allowNull:false
        },
        password:{
            type : DataTypes.STRING(500),
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

module.exports = User