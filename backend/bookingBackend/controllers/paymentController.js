const Booking = require("../models/Booking");
const BusPass = require("../models/BusPass");

const getAllPayments = async (_req, res) => {
  try {
    const payments = await BusPass.find().sort({ createdAt: -1 });
    return res.json({ success: true, payments });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch payments",
      error: error.message
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await BusPass.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    return res.json({ success: true, payment });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment",
      error: error.message
    });
  }
};

const createPayment = async (req, res) => {
  const {
    checkout = {},
    payment = {},
    studentId,
    studentName,
    travelRoute,
    startDate,
    validityPeriod,
    paymentMade
  } = req.body || {};

  const normalizedCheckout = checkout && typeof checkout === "object" ? checkout : {};
  const passenger = normalizedCheckout.passenger || {};
  const seats = Array.isArray(normalizedCheckout.seats)
    ? normalizedCheckout.seats.filter(Boolean)
    : [];
  const bookingIds = Array.isArray(normalizedCheckout.bookingIds)
    ? normalizedCheckout.bookingIds.filter(Boolean)
    : [];

  const routeFrom = normalizedCheckout.from || "";
  const routeTo = normalizedCheckout.to || "";
  const routeText = travelRoute || normalizedCheckout.route || `${routeFrom} - ${routeTo}`.trim();

  const resolvedStudentId =
    studentId ||
    passenger.nic ||
    passenger.studentId ||
    `${Date.now()}`;

  const resolvedStudentName = studentName || passenger.name;
  const resolvedStartDate =
    startDate || normalizedCheckout.departureDate || normalizedCheckout.travelDate;
  const resolvedValidityPeriod =
    validityPeriod || normalizedCheckout.validityPeriod || "1 Day";

  const hasCheckoutContext =
    bookingIds.length > 0 ||
    seats.length > 0 ||
    Boolean(normalizedCheckout.routeId || normalizedCheckout.from || normalizedCheckout.to);

  if (!hasCheckoutContext) {
    if (!resolvedStudentName || !routeText || !resolvedStartDate) {
      return res.status(400).json({
        success: false,
        message: "studentName, travelRoute, and startDate are required"
      });
    }

    try {
      const paymentRecord = await BusPass.create({
        studentId: String(resolvedStudentId),
        studentName: String(resolvedStudentName),
        travelRoute: String(routeText),
        startDate: new Date(resolvedStartDate),
        validityPeriod: String(resolvedValidityPeriod),
        paymentMade: paymentMade !== undefined ? Boolean(paymentMade) : true
      });

      return res.status(201).json({
        success: true,
        message: "Payment created successfully",
        payment: paymentRecord
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Unable to process payment",
        error: error.message
      });
    }
  }

  if (!resolvedStudentName || !routeText || !resolvedStartDate || seats.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Missing required checkout details for payment processing"
    });
  }

  try {
    let bookingsCount = 0;

    if (bookingIds.length) {
      const now = new Date();
      const updateResult = await Booking.updateMany(
        {
          _id: { $in: bookingIds },
          userId: req.user?.id || null,
          status: { $regex: "^pending$", $options: "i" },
          paymentStatus: { $regex: "^pending$", $options: "i" },
          $or: [
            { lockExpiresAt: { $gt: now } },
            { lockExpiresAt: null },
            { lockExpiresAt: { $exists: false } }
          ]
        },
        {
          $set: {
            status: "Completed",
            paymentStatus: "Paid",
            paidAt: new Date(),
            lockExpiresAt: null,
            lockReleasedAt: null
          }
        }
      );

      bookingsCount = updateResult.modifiedCount || 0;

      if (!bookingsCount) {
        return res.status(409).json({
          success: false,
          message: "Booking lock expired after 10 minutes. Please select seats again."
        });
      }
    }

    if (!bookingsCount) {
      const bookingDocs = seats.map((seatNumber) => ({
        routeId: normalizedCheckout.routeId || "",
        userId: req.user?.id || null,
        busName: normalizedCheckout.busName || "",
        from: routeFrom,
        to: routeTo,
        travelDate: normalizedCheckout.travelDate || "",
        departureDate: normalizedCheckout.departureDate || "",
        routeNumber: normalizedCheckout.routeNumber || "",
        route: routeText,
        studentName: String(resolvedStudentName),
        studentEmail: passenger.email || "",
        phone: passenger.phone || "",
        nic: passenger.nic || "",
        gender: passenger.gender || "",
        seatNumber: String(seatNumber),
        price: Number(normalizedCheckout.pricePerSeat) || Number(payment.amount) || 0,
        status: "Completed",
        paymentStatus: "Paid",
        paidAt: new Date()
      }));

      const createdBookings = await Booking.insertMany(bookingDocs);
      bookingsCount = createdBookings.length;
    }

    const busPass = await BusPass.create({
      studentId: String(resolvedStudentId),
      studentName: String(resolvedStudentName),
      travelRoute: String(routeText),
      startDate: new Date(resolvedStartDate),
      validityPeriod: String(resolvedValidityPeriod),
      paymentMade: true
    });

    return res.status(201).json({
      success: true,
      message: "Payment processed and booking completed",
      busPass,
      bookingsCount
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to process payment",
      error: error.message
    });
  }
};

const updatePayment = async (req, res) => {
  const {
    studentId,
    studentName,
    travelRoute,
    startDate,
    validityPeriod,
    paymentMade
  } = req.body || {};

  const updates = {};
  if (studentId !== undefined) updates.studentId = studentId;
  if (studentName !== undefined) updates.studentName = studentName;
  if (travelRoute !== undefined) updates.travelRoute = travelRoute;
  if (startDate !== undefined) updates.startDate = new Date(startDate);
  if (validityPeriod !== undefined) updates.validityPeriod = validityPeriod;
  if (paymentMade !== undefined) updates.paymentMade = Boolean(paymentMade);

  try {
    const payment = await BusPass.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    return res.json({ success: true, payment });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to update payment",
      error: error.message
    });
  }
};

const deletePayment = async (req, res) => {
  try {
    const payment = await BusPass.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    return res.json({
      success: true,
      message: "Payment deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to delete payment",
      error: error.message
    });
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment
};
