const Booking = require("../models/Booking");

// GET all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single booking
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE booking
exports.createBooking = async (req, res) => {
  try {
    const {
      userId,
      busName,
      from,
      to,
      travelDate,
      routeNumber,
      seatNumber,
      price,
      status,
      routeId,
      studentName,
      studentEmail,
      phone,
      nic,
      gender,
      departureDate,
      route
    } = req.body;

    const effectiveRouteId = routeId || `admin-${Date.now()}`;

    const booking = await Booking.create({
      routeId: effectiveRouteId,
      userId: userId || null,
      busName: busName || "",
      from: from || "",
      to: to || "",
      travelDate: travelDate || "",
      departureDate: departureDate || "",
      routeNumber: routeNumber || "",
      route: route || "",
      studentName: studentName || "",
      studentEmail: studentEmail || "",
      phone: phone || "",
      nic: nic || "",
      gender: gender || "",
      seatNumber: seatNumber || "",
      price: price || 0,
      status: status || "Booked"
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE booking
exports.updateBooking = async (req, res) => {
  try {
    const {
      busName,
      from,
      to,
      travelDate,
      routeNumber,
      seatNumber,
      price,
      status,
      userId,
      studentName,
      studentEmail,
      phone,
      nic,
      gender,
      departureDate,
      route
    } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (busName !== undefined) booking.busName = busName;
    if (from !== undefined) booking.from = from;
    if (to !== undefined) booking.to = to;
    if (travelDate !== undefined) booking.travelDate = travelDate;
    if (departureDate !== undefined) booking.departureDate = departureDate;
    if (routeNumber !== undefined) booking.routeNumber = routeNumber;
    if (route !== undefined) booking.route = route;
    if (studentName !== undefined) booking.studentName = studentName;
    if (studentEmail !== undefined) booking.studentEmail = studentEmail;
    if (phone !== undefined) booking.phone = phone;
    if (nic !== undefined) booking.nic = nic;
    if (gender !== undefined) booking.gender = gender;
    if (seatNumber !== undefined) booking.seatNumber = seatNumber;
    if (price !== undefined) booking.price = price;
    if (status !== undefined) booking.status = status;
    if (userId !== undefined) booking.userId = userId;

    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE booking
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Booked", "Cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET booking statistics
exports.getBookingStats = async (req, res) => {
  try {
    const total = await Booking.countDocuments();

    // Accept mixed legacy/new status values and casing from different admin flows.
    const confirmedStatuses = ["booked", "confirmed", "completed"];
    const cancelledStatuses = ["cancelled"];

    const confirmed = await Booking.countDocuments({
      $expr: {
        $in: [{ $toLower: { $ifNull: ["$status", ""] } }, confirmedStatuses]
      }
    });

    const cancelled = await Booking.countDocuments({
      $expr: {
        $in: [{ $toLower: { $ifNull: ["$status", ""] } }, cancelledStatuses]
      }
    });

    res.json({
      // Current API keys
      totalBookings: total,
      bookedCount: confirmed,
      cancelledCount: cancelled,

      // Backward-compatible keys used elsewhere
      total,
      booked: confirmed,
      cancelled,
      cancellationRate: total > 0 ? ((cancelled / total) * 100).toFixed(2) + "%" : "0%"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SEARCH bookings
exports.searchBookings = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Search term is required" });
    }

    const bookings = await Booking.find({
      $or: [
        { busName: { $regex: q, $options: "i" } },
        { from: { $regex: q, $options: "i" } },
        { to: { $regex: q, $options: "i" } },
        { routeNumber: { $regex: q, $options: "i" } },
        { userId: { $regex: q, $options: "i" } }
      ]
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
