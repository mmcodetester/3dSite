const express = require('express')
const router = express.Router()
const controller = require('../../controllers/reports/dailyreport.controller')
const authService = require('../../services/auth.service')

router.get('/', controller.GetAll)
router.get('/detail-report', authService.AuthGuard, controller.GetAllDetailReport)
router.get('/gettodaytotal', authService.AuthGuard, controller.GetTodayTotal)
router.get('/export-excel-detail-report', authService.AuthGuard, controller.ExportExcelDetailReport)
router.get('/detailstotalamount', authService.AuthGuard, controller.GetDetailsTotalAmount)
router.delete('/delete', authService.AuthGuard, controller.Delete)

module.exports = router