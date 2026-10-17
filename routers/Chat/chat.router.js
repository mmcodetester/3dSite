const controller = require('../../controllers/Chat/chat.controller')
const router = require('express').Router()
const { AuthGuard } = require('../../services/auth.service')
router.use(AuthGuard)
router.get('/users', controller.Users)
router.get('/rooms', controller.Rooms)
router.post('/rooms', controller.CreateRoom)
router.get('/', controller.GetAll)
router.post('/send', controller.SendMessage)
router.post('/typing', controller.SendTypingEvent)
router.post('/devices', controller.RegisterDevice)
router.delete('/devices', controller.UnregisterDevice)
const extras = require('../../controllers/Chat/chat-features.controller')
router.get('/rooms/:roomId/deletions', extras.Deletions)
router.delete('/rooms/:roomId/messages/:messageId', extras.Delete)
router.post('/rooms/:roomId/read', extras.Read)
router.post('/rooms/:roomId/messages/:messageId/pin', extras.Pin)
router.post(
    '/rooms/:roomId/attachments',
    require('express').raw({ type: 'application/octet-stream', limit: '10mb' }),
    extras.Upload,
)
router.get('/attachments/:id', extras.Download)
router.delete('/attachments/:id', extras.DiscardUpload)
module.exports = router
