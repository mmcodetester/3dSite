const express = require('express')
const router = express.Router()
const controller = require('../controllers/number.controller')
const { AuthGuard } = require('../services/auth.service')

router.get('/', AuthGuard, controller.GetAll)
router.get('/getavailable', AuthGuard, controller.GetAvailable)
module.exports = router