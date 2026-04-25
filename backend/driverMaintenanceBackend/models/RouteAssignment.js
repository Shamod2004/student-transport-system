const mongoose = require('mongoose')

const routeAssignmentSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    routeName: { type: String, required: true },
    destination: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    frequency: { type: String, default: 'Daily' },
    status: {
      type: String,
      enum: ['Scheduled', 'En Route', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
    assignedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

module.exports = mongoose.model('RouteAssignment', routeAssignmentSchema)
