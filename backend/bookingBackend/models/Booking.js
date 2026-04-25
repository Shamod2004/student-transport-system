const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: true
  },

  userId: {
    type: String,
    default: null
  },

  busName: String,
  from: String,
  to: String,
  travelDate: String,
  departureDate: String,
  routeNumber: String,
  route: String,

  studentName: String,
  studentEmail: String,
  phone: String,
  nic: String,
  gender: String,

  seatNumber: String,
  price: Number,

  status: {
    type: String,
    default: "Booked"
  },

  paymentStatus: {
    type: String,
    default: "Pending"
  },

  lockExpiresAt: {
    type: Date,
    default: null
  },

  lockReleasedAt: {
    type: Date,
    default: null
  },

  paidAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
