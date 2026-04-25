const express = require('express')
const router = express.Router()
const {
  getAllTickets,
  createTicket,
  updateTicket,
  deleteTicket,
} = require('../controllers/maintenanceController')
const { protect } = require('../middleware/authMiddleware')

router.route('/').get(protect, getAllTickets).post(protect, createTicket)
router.route('/:id').put(protect, updateTicket).delete(protect, deleteTicket)

module.exports = router
