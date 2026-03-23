const { Sequelize} = require('sequelize')
require('dotenv').config()

const database = new Sequelize(process.env.DB_URL, {
    dialect:'postgres',
    ssl:{
        require: true,
        rejectUnauthorized: false
    },
})

module.exports = database