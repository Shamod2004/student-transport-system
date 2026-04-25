const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    busId: {
      type: String,
      required: true,
      index: true
    },
    seatNumber: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["available", "held", "booked"],
      default: "available",
      index: true
    },
    heldBy: {
      type: String,
      default: null
    },
    holdExpiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

seatSchema.index({ busId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model("Seat", seatSchema);
