const express = require('express')
const router = express.Router()
const {
  getAllLeaveRequests,
  getLeavesByDriver,
  createLeaveRequest,
  updateLeaveStatus,
} = require('../controllers/leaveController')
const { protect, requireAdmin, requireDriverOrAdmin } = require('../middleware/authMiddleware')

router.route('/').get(protect, requireAdmin, getAllLeaveRequests).post(protect, requireDriverOrAdmin, createLeaveRequest)
router.route('/driver/:driverId').get(protect, requireDriverOrAdmin, getLeavesByDriver)
router.route('/:id/status').put(protect, requireAdmin, updateLeaveStatus)

module.exports = router
