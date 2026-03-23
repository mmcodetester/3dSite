const express = require('express')
const router = express.Router()
const controller = require('../controllers/order.controller')
const { AuthGuard } = require('../services/auth.service')

router.post('/', AuthGuard,controller.Save)

module.exports = router