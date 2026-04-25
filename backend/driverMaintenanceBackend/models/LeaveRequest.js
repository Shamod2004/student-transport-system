const mongoose = require('mongoose')

const leaveRequestSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    leaveType: {
      type: String,
      enum: ['Sick Leave', 'Annual Leave', 'Emergency Leave', 'Other'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema)
