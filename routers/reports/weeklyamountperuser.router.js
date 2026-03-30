const  express = require('express')
const router = express.Router()
const controller = require('../../controllers/reports/weeklyamountperuser.controller')
const { AuthGuard } = require('../../services/auth.service')

router.get('/', AuthGuard, controller.GetAll)
router.get('/gettotal', AuthGuard, controller.GetTotal)

module.exports = router