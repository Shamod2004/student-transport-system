const Bus = require('../models/Bus')

// GET all buses
exports.getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find().populate('assignedDriver', 'name licenseNumber')
    res.json(buses)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET single bus
exports.getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
    if (!bus) return res.status(404).json({ message: 'Bus not found' })
    res.json(bus)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// CREATE bus
exports.createBus = async (req, res) => {
  try {
    const { plateNumber, brand, model, seatingCapacity } = req.body

    if (!plateNumber || !brand || !model || !seatingCapacity) {
      return res.status(400).json({
        message: 'Plate number, brand, model, and seating capacity are required.'
      })
    }

    const normalizedPlate = plateNumber.trim().toUpperCase()

    // Case-insensitive exact duplicate check
    const existing = await Bus.findOne({
      plateNumber: { $regex: new RegExp('^' + normalizedPlate + '$', 'i') }
    })

    if (existing) {
      return res.status(400).json({
        message: 'A bus with plate number "' + normalizedPlate + '" is already registered.',
        conflictDetected: true,
        existingId: existing._id
      })
    }

    const bus = await Bus.create({
      ...req.body,
      plateNumber: normalizedPlate,
      year: req.body.year || new Date().getFullYear()
    })

    res.status(201).json(bus)
  } catch (err) {
    if (err.code === 11000) {
      const conflictKey = Object.keys(err.keyValue || {})[0]
      const conflictVal = err.keyValue ? err.keyValue[conflictKey] : ''
      return res.status(400).json({
        message: 'A bus with ' + conflictKey + ' "' + conflictVal + '" is already registered.',
        conflictDetected: true
      })
    }
    res.status(400).json({ message: err.message })
  }
}

// UPDATE bus
exports.updateBus = async (req, res) => {
  try {
    if (req.body.plateNumber) {
      const normalizedPlate = req.body.plateNumber.trim().toUpperCase()

      const existing = await Bus.findOne({
        plateNumber: { $regex: new RegExp('^' + normalizedPlate + '$', 'i') },
        _id: { $ne: req.params.id }
      })

      if (existing) {
        return res.status(400).json({
          message: 'A bus with plate number "' + normalizedPlate + '" is already registered.',
          conflictDetected: true
        })
      }

      req.body.plateNumber = normalizedPlate
    }

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!bus) return res.status(404).json({ message: 'Bus not found' })
    res.json(bus)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: 'A bus with that plate number is already registered.',
        conflictDetected: true
      })
    }
    res.status(400).json({ message: err.message })
  }
}

// DELETE bus
exports.deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id)
    if (!bus) return res.status(404).json({ message: 'Bus not found' })
    res.json({ message: 'Bus deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
