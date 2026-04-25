const LeaveRequest = require('../models/LeaveRequest')

// GET all leave requests
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find()
      .populate('driver', 'name licenseNumber')
      .sort({ createdAt: -1 })
    res.json(leaves)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET leave requests by driver
exports.getLeavesByDriver = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ driver: req.params.driverId })
      .sort({ createdAt: -1 })
    res.json(leaves)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// CREATE leave request
exports.createLeaveRequest = async (req, res) => {
  try {
    const { startDate, endDate } = req.body
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be on or after start date' })
    }
    const leave = await LeaveRequest.create(req.body)
    res.status(201).json(leave)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// UPDATE leave status (admin)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    )
    if (!leave) return res.status(404).json({ message: 'Leave request not found' })
    res.json(leave)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}
