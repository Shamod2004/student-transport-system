const Driver = require('../models/Driver')

// GET all drivers
exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().populate('assignedBus', 'plateNumber brand')
    res.json(drivers)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET single driver
exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)
    if (!driver) return res.status(404).json({ message: 'Driver not found' })
    res.json(driver)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET driver by user account ID
exports.getDriverByUserId = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userAccount: req.params.userId })
    if (!driver) return res.status(404).json({ message: 'Driver data not found' })
    res.json(driver)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// CREATE driver
exports.createDriver = async (req, res) => {
  try {
    // Normalize license number to avoid silent duplicates from whitespace/case differences
    const body = { ...req.body }
    if (body.licenseNumber) {
      body.licenseNumber = body.licenseNumber.trim().toUpperCase()
    }

    console.log('createDriver body:', JSON.stringify(body))

    // Check for existing license before hitting the unique index so we can return a clear message
    const existing = await Driver.findOne({ licenseNumber: body.licenseNumber })
    if (existing) {
      return res.status(400).json({ message: `License number "${body.licenseNumber}" is already registered to another driver.` })
    }

    const driver = await Driver.create(body)
    res.status(201).json(driver)
  } catch (err) {
    console.error('createDriver error:', err.message, JSON.stringify(err.errors || {}))
    res.status(400).json({ message: err.message, errors: err.errors })
  }
}

// UPDATE driver
exports.updateDriver = async (req, res) => {
  try {
    const body = { ...req.body }
    if (body.licenseNumber) {
      body.licenseNumber = body.licenseNumber.trim().toUpperCase()
    }
    const driver = await Driver.findByIdAndUpdate(req.params.id, body, { new: true })
    if (!driver) return res.status(404).json({ message: 'Driver not found' })
    res.json(driver)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// DELETE driver
exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id)
    if (!driver) return res.status(404).json({ message: 'Driver not found' })
    res.json({ message: 'Driver deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
