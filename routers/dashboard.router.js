const express = require('express')
const router = express.Router()
const controller = require('../controllers/dashboard/dashboard.controller')

const { AuthGuard } = require('../services/auth.service')

router.get('/getdailycompairsm', AuthGuard, controller.GetDailyCompairsm)
router.get('/getmonthlycompairsm',  controller.GetMonthlyCompairsm)


module.exports = router