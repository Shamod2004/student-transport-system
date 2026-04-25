const express = require('express')
const router = express.Router()
const {
  getAllInspections,
  getInspectionsByDriver,
  createInspection,
  getInspectionById,
  getDailyOperations,
  updateInspection,
  deleteInspection
} = require('../controllers/inspectionController')
const { protect } = require('../middleware/authMiddleware')

router.route('/').get(protect, getAllInspections).post(protect, createInspection)
router.get('/daily-operations', protect, getDailyOperations)
router.route('/driver/:driverId').get(protect, getInspectionsByDriver)
router.route('/:id')
  .get(protect, getInspectionById)
  .put(protect, updateInspection)
  .delete(protect, deleteInspection)

module.exports = router
