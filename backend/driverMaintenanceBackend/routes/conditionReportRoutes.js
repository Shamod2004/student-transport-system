const express = require('express')
const router = express.Router()
const {
  getAllReports,
  createReport,
  updateReport,
  deleteReport,
} = require('../controllers/conditionReportController')
const { protect } = require('../middleware/authMiddleware')

router.route('/').get(protect, getAllReports).post(protect, createReport)
router.route('/:id').put(protect, updateReport).delete(protect, deleteReport)

module.exports = router
