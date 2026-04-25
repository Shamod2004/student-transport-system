const Inspection = require('../models/Inspection')
const RouteAssignment = require('../models/RouteAssignment')

// GET all inspections
exports.getAllInspections = async (req, res) => {
  try {
    const inspections = await Inspection.find()
      .populate('driver', 'name licenseNumber')
      .populate('bus', 'plateNumber brand model')
      .sort({ createdAt: -1 })
    res.json(inspections)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET inspections by driver
exports.getInspectionsByDriver = async (req, res) => {
  try {
    const inspections = await Inspection.find({ driver: req.params.driverId })
      .populate('bus', 'plateNumber brand model')
      .sort({ createdAt: -1 })
    res.json(inspections)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// CREATE inspection
exports.createInspection = async (req, res) => {
  try {
    const inspection = await Inspection.create(req.body)
    const populated = await inspection.populate([
      { path: 'driver', select: 'name licenseNumber' },
      { path: 'bus', select: 'plateNumber brand model' },
    ])
    res.status(201).json(populated)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// GET single inspection
exports.getInspectionById = async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('driver', 'name licenseNumber contactNumber')
      .populate('bus', 'plateNumber brand model')
    if (!inspection) return res.status(404).json({ message: 'Inspection not found' })
    res.json(inspection)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// UPDATE inspection
exports.updateInspection = async (req, res) => {
  try {
    const inspection = await Inspection.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('driver', 'name licenseNumber contactNumber')
      .populate('bus', 'plateNumber brand model')
    if (!inspection) return res.status(404).json({ message: 'Inspection not found' })
    res.json(inspection)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// DELETE inspection
exports.deleteInspection = async (req, res) => {
  try {
    const inspection = await Inspection.findByIdAndDelete(req.params.id)
    if (!inspection) return res.status(404).json({ message: 'Inspection not found' })
    res.json({ message: 'Inspection deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET Daily Operations Stats (Aggregated)
exports.getDailyOperations = async (req, res) => {
  try {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    // 1. Get all routes scheduled for today
    const assignments = await RouteAssignment.find({
      assignedDate: { $gte: start, $lte: end }
    })
    .populate('driver', 'name licenseNumber contactNumber')
    .populate('bus', 'plateNumber brand model')

    // 2. Get all inspections submitted today
    const inspections = await Inspection.find({
      submittedAt: { $gte: start, $lte: end }
    })

    // 3. Merge data
    const reports = assignments.map(assign => {
      // Guard against null driver/bus from deleted records
      if (!assign.driver || !assign.bus) return null

      const inspection = inspections.find(ins => {
        if (!ins.driver || !ins.bus) return false
        return ins.driver.toString() === assign.driver._id.toString() &&
               ins.bus.toString() === assign.bus._id.toString()
      })

      return {
        _id: assign._id,
        driver: assign.driver,
        bus: assign.bus,
        route: assign.routeName,
        destination: assign.destination,
        startTime: assign.startTime,
        checkInTime: inspection ? inspection.submittedAt : null,
        status: inspection ? inspection.result : 'Pending',
        inspectionId: inspection ? inspection._id : null
      }
    }).filter(Boolean) // Remove null entries from deleted driver/bus records

    // 4. Calculate Stats
    const stats = {
      scheduledToday: assignments.length,
      pending: reports.filter(r => r.status === 'Pending').length,
      fitToDuty: reports.filter(r => r.status === 'Fit for Duty').length,
      issues: reports.filter(r => r.status === 'Issue Reported').length
    }

    res.json({ stats, reports })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
