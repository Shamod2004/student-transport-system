const WorkOrder = require('../models/WorkOrder')

exports.getAllWorkOrders = async (req, res) => {
  try {
    const orders = await WorkOrder.find()
      .populate('bus', 'plateNumber brand model')
      .sort({ createdAt: -1 }) // Newest first
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createWorkOrder = async (req, res) => {
  try {
    const order = await WorkOrder.create(req.body)
    const populated = await order.populate('bus', 'plateNumber brand')
    res.status(201).json(populated)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.updateWorkOrder = async (req, res) => {
  try {
    const order = await WorkOrder.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('bus', 'plateNumber brand')
    if (!order) return res.status(404).json({ message: 'Work order not found' })
    res.json(order)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.deleteWorkOrder = async (req, res) => {
  try {
    const order = await WorkOrder.findByIdAndDelete(req.params.id)
    if (!order) return res.status(404).json({ message: 'Work order not found' })
    res.json({ message: 'Work order deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
