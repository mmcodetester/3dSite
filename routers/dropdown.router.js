const express = require('express')
const router = express.Router()
const controller = require('../controllers/dropdown.controller')
const { AuthGuard } = require('../services/auth.service')
const monthController = require('../controllers/month.controller')

router.get('/getmonthlist', AuthGuard, monthController.GetAll)
router.get('/getuserlist', AuthGuard, controller.GetUserList)
router.get('/getweeklistbyyear', controller.GetWeeklyListByYear)

module.exports = router