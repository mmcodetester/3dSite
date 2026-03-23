const controller = require('../controllers/user.controller')
const express = require('express')
const { AuthGuard } = require('../services/auth.service')
const router = express.Router()

router.get('/', AuthGuard, controller.GetAll)
router.post('/', AuthGuard,controller.Save)
router.get('/getbyid', AuthGuard,controller.GetById)
router.delete('/delete',AuthGuard, controller.Delete)

module.exports = router