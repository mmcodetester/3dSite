const { Sequelize} = require('sequelize')
require('dotenv').config()
//process.env.DB_URL
//process.env.TESTING_DB_URL
const database = new Sequelize(process.env.DB_URL, {
    dialect:'postgres',
    ssl:{
        require: true,
        rejectUnauthorized: false
    },
})

module.exports = database