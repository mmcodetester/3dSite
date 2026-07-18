const controller = require('../../controllers/Chat/chat.controller')
const express = require('express')
const { AuthGuard } = require('../../services/auth.service')
const router = express.Router()

router.get('/', AuthGuard, controller.GetAll)
router.post('/send', AuthGuard, controller.SendMessage)


module.exports = router