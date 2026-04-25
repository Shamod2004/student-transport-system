const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const busPassSchema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    travelRoute: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    validityPeriod: {
      type: String,
      required: true,
    },
    paymentMade: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusPass", busPassSchema);
