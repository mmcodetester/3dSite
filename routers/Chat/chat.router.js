const controller = require('../../controllers/Chat/chat.controller')
const express = require('express')
const { AuthGuard } = require('../../services/auth.service')
const router = express.Router()

router.get('/', AuthGuard, controller.GetAll)
router.post('/send', AuthGuard, controller.SendMessage)
router.get('/sendtypingevent', AuthGuard, controller.SendTypingEvent)

module.exports = router