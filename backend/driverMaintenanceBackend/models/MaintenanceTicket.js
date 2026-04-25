const mongoose = require('mongoose')

const maintenanceTicketSchema = new mongoose.Schema(
  {
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    serviceType: { type: String, required: true },
    currentMileage: { type: Number, required: true },
    nextServiceAt: { type: Number, required: true },
    priority: { type: String, enum: ['Normal', 'Urgent'], default: 'Normal' },
    notes: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('MaintenanceTicket', maintenanceTicketSchema)
