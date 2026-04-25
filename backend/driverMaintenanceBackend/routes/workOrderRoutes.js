const express = require('express')
const router = express.Router()
const {
  getAllWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
} = require('../controllers/workOrderController')
const { protect } = require('../middleware/authMiddleware')

router.route('/').get(protect, getAllWorkOrders).post(protect, createWorkOrder)
router.route('/:id').put(protect, updateWorkOrder).delete(protect, deleteWorkOrder)

module.exports = router
