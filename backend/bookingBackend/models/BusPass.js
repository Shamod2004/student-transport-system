const mongoose = require("mongoose");

const busPassSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      trim: true
    },
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    travelRoute: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    validityPeriod: {
      type: String,
      required: true,
      trim: true
    },
    paymentMade: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusPass", busPassSchema);
