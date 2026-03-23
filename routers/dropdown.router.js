const express = require('express')
const router = express.Router()
const controller = require('../controllers/dropdown.controller')
const { AuthGuard } = require('../services/auth.service')

router.get('/get_month_list',AuthGuard, controller.GetMonthList)

module.exports = router