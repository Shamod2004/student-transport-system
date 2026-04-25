const mongoose = require('mongoose')

const inspectionSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    currentMileage: { type: Number, required: true },
    fuelLevel: {
      type: String,
      enum: ['Empty', '1/4', '1/2', '3/4', 'Full'],
      required: true,
    },
    conditions: {
      brakes: { type: String, enum: ['Good', 'Issue'], default: 'Good' },
      tireCondition: { type: String, enum: ['Good', 'Issue'], default: 'Good' },
      batteryCondition: { type: String, enum: ['Good', 'Issue'], default: 'Good' },
      engineCondition: { type: String, enum: ['Good', 'Issue'], default: 'Good' },
      oilAndCoolant: { type: String, enum: ['Good', 'Issue'], default: 'Good' },
      lights: { type: String, enum: ['Good', 'Issue'], default: 'Good' },
      mirrorsAndGlasses: { type: String, enum: ['Good', 'Issue'], default: 'Good' },
      interiorCleanliness: { type: String, enum: ['Good', 'Issue'], default: 'Good' },
    },
    additionalNotes: { type: String, default: '' },
    result: {
      type: String,
      enum: ['Fit for Duty', 'Issue Reported'],
      required: true,
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Inspection', inspectionSchema)
