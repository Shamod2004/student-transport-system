const express = require('express')
const router = express.Router()
const { getAllDrivers, getDriverById, getDriverByUserId, createDriver, updateDriver, deleteDriver } = require('../controllers/driverController')
const { protect, requireAdmin, requireDriverOrAdmin } = require('../middleware/authMiddleware')

router.route('/').get(protect, requireAdmin, getAllDrivers).post(protect, requireAdmin, createDriver)
router.route('/user/:userId').get(protect, requireDriverOrAdmin, getDriverByUserId)
router.route('/:id').get(protect, requireDriverOrAdmin, getDriverById).put(protect, requireAdmin, updateDriver).delete(protect, requireAdmin, deleteDriver)

module.exports = router
