const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    licenseExpiry: {
      type: Date
    },
    assignedBus: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "on-duty", "off-duty", "suspended"]
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);