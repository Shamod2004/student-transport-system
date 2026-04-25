const express = require('express')
const router = express.Router()
const {
  getAllRouteAssignments,
  getAssignmentsByDriver,
  createRouteAssignment,
  updateRouteAssignment,
  deleteRouteAssignment,
} = require('../controllers/routeAssignmentController')
const { protect, requireAdmin, requireDriverOrAdmin } = require('../middleware/authMiddleware')

router.route('/').get(protect, requireAdmin, getAllRouteAssignments).post(protect, requireAdmin, createRouteAssignment)
router.route('/driver/:driverId').get(protect, requireDriverOrAdmin, getAssignmentsByDriver)
router.route('/:id').put(protect, requireAdmin, updateRouteAssignment).delete(protect, requireAdmin, deleteRouteAssignment)

module.exports = router
