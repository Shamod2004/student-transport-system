const MaintenanceTicket = require('../models/MaintenanceTicket')

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await MaintenanceTicket.find().populate('bus', 'plateNumber brand model mileage')
    res.json(tickets)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.createTicket = async (req, res) => {
  try {
    const ticket = await MaintenanceTicket.create(req.body)
    const populated = await ticket.populate('bus', 'plateNumber brand model mileage')
    res.status(201).json(populated)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.updateTicket = async (req, res) => {
  try {
    const ticket = await MaintenanceTicket.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('bus', 'plateNumber brand model mileage')
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    res.json(ticket)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await MaintenanceTicket.findByIdAndDelete(req.params.id)
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    res.json({ message: 'Ticket deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
