const express = require('express')
const router = express.Router()
const controller = require('../controllers/monthly.amount.controller')
const { AuthGuard } = require('../services/auth.service')

router.get('/',AuthGuard, controller.GetAll)
router.post('/', AuthGuard,controller.Save)
router.get('/getbyid', AuthGuard,controller.GetById)
router.delete('/delete', AuthGuard,controller.Delete)

module.exports = router