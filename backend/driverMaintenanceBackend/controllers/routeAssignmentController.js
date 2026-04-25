const RouteAssignment = require('../models/RouteAssignment')
const Driver = require('../models/Driver')
const Bus = require('../models/Bus')

// GET all route assignments
exports.getAllRouteAssignments = async (req, res) => {
  try {
    const assignments = await RouteAssignment.find()
      .populate('driver', 'name licenseNumber status')
      .populate('bus', 'plateNumber brand status')
      .sort({ createdAt: -1 })
    res.json(assignments)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET route assignments by driver
exports.getAssignmentsByDriver = async (req, res) => {
  try {
    const assignments = await RouteAssignment.find({ driver: req.params.driverId })
      .populate('bus', 'plateNumber brand status')
      .sort({ createdAt: -1 })
    res.json(assignments)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// CREATE route assignment (with availability check)
exports.createRouteAssignment = async (req, res) => {
  try {
    const { driver: driverId, bus: busId, routeName, destination, startTime, endTime } = req.body

    // 1. Check Driver availability (Relaxed)
    const driver = await Driver.findById(driverId)
    if (!driver) return res.status(404).json({ message: 'Driver not found' })
    if (driver.status === 'Suspended') {
      return res.status(400).json({ message: `Cannot assign: Driver is currently Suspended` })
    }

    // Check if Driver is already busy
    const busyDriver = await RouteAssignment.findOne({ 
      driver: driverId, 
      status: { $in: ['Scheduled', 'En Route'] } 
    })
    if (busyDriver) return res.status(400).json({ message: `Driver ${driver.name} is already assigned to an active route (${busyDriver.routeName})` })

    // 2. Check Bus availability (Relaxed)
    const bus = await Bus.findById(busId)
    if (!bus) return res.status(404).json({ message: 'Bus not found' })
    if (bus.status === 'Retired') {
      return res.status(400).json({ message: `Cannot assign: Bus is Retired` })
    }

    // Check if Bus is already busy
    const busyBus = await RouteAssignment.findOne({ 
      bus: busId, 
      status: { $in: ['Scheduled', 'En Route'] } 
    })
    if (busyBus) return res.status(400).json({ message: `Bus ${bus.plateNumber} is already assigned to an active route (${busyBus.routeName})` })

    // 3. Create Assignment
    const assignment = await RouteAssignment.create({
      driver: driverId,
      bus: busId,
      routeName,
      destination,
      startTime,
      endTime: endTime || startTime, // fallback if empty
      frequency: req.body.frequency || 'Daily',
      status: req.body.status || 'Scheduled'
    })

    // Populate for the response
    const populated = await assignment.populate([
      { path: 'driver', select: 'name licenseNumber' },
      { path: 'bus', select: 'plateNumber brand' },
    ])

    res.status(201).json(populated)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// UPDATE route assignment
exports.updateRouteAssignment = async (req, res) => {
  try {
    const { driver, bus } = req.body;
    const existingAssignment = await RouteAssignment.findById(req.params.id);
    if (!existingAssignment) return res.status(404).json({ message: 'Assignment not found' });

    // 1. Check Driver availability ONLY if changed
    if (driver && driver !== existingAssignment.driver.toString()) {
      const d = await Driver.findById(driver);
      if (!d) return res.status(404).json({ message: 'Driver not found' });
      if (d.status === 'Suspended') return res.status(400).json({ message: `Cannot assign: Driver is currently Suspended` });
      
      const busyDriver = await RouteAssignment.findOne({ 
        driver, 
        _id: { $ne: req.params.id },
        status: { $in: ['Scheduled', 'En Route'] } 
      })
      if (busyDriver) return res.status(400).json({ message: `Driver ${d.name} is already busy on another route: ${busyDriver.routeName}` })
    }

    // 2. Check Bus availability ONLY if changed
    if (bus && bus !== existingAssignment.bus.toString()) {
      const b = await Bus.findById(bus);
      if (!b) return res.status(404).json({ message: 'Bus not found' });
      if (b.status === 'Retired') return res.status(400).json({ message: `Cannot assign: Bus is Retired` });

      const busyBus = await RouteAssignment.findOne({ 
        bus, 
        _id: { $ne: req.params.id },
        status: { $in: ['Scheduled', 'En Route'] } 
      })
      if (busyBus) return res.status(400).json({ message: `Bus ${b.plateNumber} is already busy on another route: ${busyBus.routeName}` })
    }

    const assignment = await RouteAssignment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('driver', 'name licenseNumber status')
      .populate('bus', 'plateNumber brand status');
    
    res.json(assignment)
  } catch (err) {
    console.error('Update Assignment Error:', err);
    res.status(400).json({ message: err.message })
  }
}

// DELETE assignment
exports.deleteRouteAssignment = async (req, res) => {
  try {
    const assignment = await RouteAssignment.findByIdAndDelete(req.params.id)
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' })
    res.json({ message: 'Route assignment deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
