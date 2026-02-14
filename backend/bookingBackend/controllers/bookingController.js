const Booking = require("../models/Booking");

exports.createBooking = async (req, res) => {
  const booking = await Booking.create(req.body);
  res.status(201).json(booking);
};

exports.getBookings = async (req, res) => {
  const bookings = await Booking.find();
  res.json(bookings);
};

exports.updateBooking = async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(booking);
};

exports.deleteBooking = async (req, res) => {
  await Booking.findByIdAndDelete(req.params.id);
  res.json({ message: "Booking deleted" });
};
