const mongoose = require('mongoose')

const conditionReportSchema = new mongoose.Schema(
  {
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    issueDetails: { type: String, required: true },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      required: true,
    },
    vehicleStatus: {
      type: String,
      enum: ['Grounded', 'Inspection Scheduled', 'Available'],
      default: 'Available',
      required: true,
    },
    reportDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

module.exports = mongoose.model('ConditionReport', conditionReportSchema)
