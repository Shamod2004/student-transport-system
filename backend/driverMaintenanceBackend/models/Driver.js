const mongoose = require('mongoose')

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    contactNumber: { type: String, required: true },
    email: { type: String },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Suspended'],
      default: 'Active',
    },
    userAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedBus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
    joiningDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Driver', driverSchema)
