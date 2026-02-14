const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },

  routeId: { type: String, required: true }, // from friend
  pickupPoint: String,
  dropPoint: String,

  travelDate: Date,
  seatNumber: { type: Number, default: null },

  status: { type: String, default: "BOOKED" }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
