const express = require('express')
const router = express.Router()
const controller = require('../../controllers/reports/ordertotal.controller')
const { AuthGuard } = require('../../services/auth.service')

router.get('/', AuthGuard, controller.Get)

module.exports = router