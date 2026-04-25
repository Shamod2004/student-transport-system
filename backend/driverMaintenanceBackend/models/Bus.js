const mongoose = require('mongoose')

const busSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, unique: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    gearType: { type: String, enum: ['Manual', 'Automatic'], default: 'Manual' },
    mileage: { type: Number, default: 0 },
    seatingCapacity: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Active', 'Under Maintenance', 'Retired'],
      default: 'Active',
    },
    lastMaintenanceDate: { type: Date },
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Bus', busSchema)
