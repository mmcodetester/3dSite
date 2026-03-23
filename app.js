const express = require('express')
const database = require('./utils/data/database')
const app = express()
const bodyParser = require('body-parser')
const numberController = require('./controllers/number.controller')
const monthController = require('./controllers/month.controller')
require('dotenv').config()

const cors = require('cors')

app.use(cors({
    origin: '*',
    methods:['GET', 'POST', 'PUT', 'DELETE']
}))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const userRouter = require('./routers/user.router')
const numberRouter = require('./routers/number.router')
const dropdownRouter = require('./routers/dropdown.router')
const monthlyAmountRouter = require('./routers/monthly_amount.router')
const orderRouter = require('./routers/order.router')
const authRouter = require('./routers/auth.router')
const dailyReportRouter = require('./routers/reports/dailyreport.router')
const orderTotalRouter = require('./routers/reports/ordertotal.router')
const dashboardRouter = require('./routers/dashboard.router')
app.use('/api/user', userRouter)
app.use('/api/number', numberRouter)
app.use('/api/dropdown', dropdownRouter)
app.use('/api/monthlyamount', monthlyAmountRouter)
app.use('/api/order', orderRouter)
app.use('/api/auth', authRouter)
app.use('/api/dailyreport', dailyReportRouter)
app.use('/api/ordertotal', orderTotalRouter)
app.use('/api/dashboard', dashboardRouter)


database.authenticate().then((res) => {
    console.log('database connected')
}).catch((err) => {
})
database.sync({ force: false }).then(async (res) => {
    await numberController.InitNumber()
    await monthController.InitMonth()
}).catch((err) => {
})


app.listen(8088, (err) => {
    if (err) console.log('err starting server - ', err)
    console.log('app is starting on port ', 8088)
})