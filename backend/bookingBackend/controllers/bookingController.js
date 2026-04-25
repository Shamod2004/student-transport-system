const Booking = require("../models/Booking");
const Notification = require("../models/Notification");

const BOOKING_LOCK_MINUTES = Math.max(1, Number(process.env.BOOKING_LOCK_MINUTES || 10));

const isPendingStatus = (status) => String(status || "").toLowerCase() === "pending";
const isPendingPaymentStatus = (status) => String(status || "").toLowerCase() === "pending";

const buildExpiredPendingBookingFilter = (now = new Date()) => {
  const fallbackExpiry = new Date(now.getTime() - BOOKING_LOCK_MINUTES * 60 * 1000);

  return {
    status: { $regex: "^pending$", $options: "i" },
    paymentStatus: { $regex: "^pending$", $options: "i" },
    $or: [
      { lockExpiresAt: { $lte: now } },
      {
        $and: [
          {
            $or: [
              { lockExpiresAt: null },
              { lockExpiresAt: { $exists: false } }
            ]
          },
          { createdAt: { $lte: fallbackExpiry } }
        ]
      }
    ]
  };
};

const releaseExpiredPendingBookings = async () => {
  const now = new Date();
  const result = await Booking.updateMany(
    buildExpiredPendingBookingFilter(now),
    {
      $set: {
        status: "Uncompleted",
        paymentStatus: "Uncompleted",
        lockReleasedAt: now
      },
      $unset: {
        lockExpiresAt: ""
      }
    }
  );

  return result.modifiedCount || 0;
};

exports.releaseExpiredPendingBookingsJob = async () => releaseExpiredPendingBookings();

const parseSeatId = (seatId) => {
  const value = String(seatId || "").trim().toUpperCase();
  const match = value.match(/^([A-Z])(\d+)$/);
  if (!match) return null;

  return {
    row: match[1],
    col: Number(match[2])
  };
};

const buildSeatId = (row, col) => `${row}${col}`;

const getAdjacentSeatIds = (seatId) => {
  const parsed = parseSeatId(seatId);
  if (!parsed) return [];

  const adjacent = [];
  if (parsed.col > 1) adjacent.push(buildSeatId(parsed.row, parsed.col - 1));
  if (parsed.col < 4) adjacent.push(buildSeatId(parsed.row, parsed.col + 1));
  return adjacent;
};

const createAdjacentGenderAlertFromBooking = async ({ booking, actorUserId }) => {
  const bookingGender = String(booking.gender || "").toLowerCase();
  if (bookingGender !== "male") {
    // Rule: only male-after-female booking creates account notification with seat-change action.
    return;
  }

  const adjacentSeatIds = getAdjacentSeatIds(booking.seatNumber);
  if (!adjacentSeatIds.length) return;

  const adjacentBooking = await Booking.findOne({
    routeId: booking.routeId,
    seatNumber: { $in: adjacentSeatIds },
    gender: { $regex: "^female$", $options: "i" },
    departureDate: booking.departureDate || "",
    travelDate: booking.travelDate || ""
  }).sort({ createdAt: -1 });

  if (!adjacentBooking || !adjacentBooking.userId) return;
  if (String(adjacentBooking.userId) === String(actorUserId || "")) return;

  const actorName = booking.studentName || "A male student";

  const selectedSeatId = String(booking.seatNumber || "").trim().toUpperCase();
  const adjacentSeatId = String(adjacentBooking.seatNumber || "").trim().toUpperCase();

  // Keep one active alert per seat-pair for the same recipient.
  const existingUnread = await Notification.findOne({
    recipientUserId: adjacentBooking.userId,
    type: "gender-seat-alert",
    isRead: false,
    "metadata.selectedSeatId": selectedSeatId,
    "metadata.adjacentSeatId": adjacentSeatId
  });

  if (existingUnread) {
    await Notification.findByIdAndUpdate(existingUnread._id, {
      message: `${actorName} booked seat ${selectedSeatId} next to your seat ${adjacentSeatId}. You can change your seat if you prefer.`,
      createdByUserId: actorUserId || null,
      metadata: {
        selectedSeatId,
        adjacentSeatId,
        canChangeSeat: true,
        actionLabel: "Change seat",
        secondaryActionLabel: "I prefer this seat",
        redirectTo: "/"
      }
    });
    return;
  }

  await Notification.create({
    recipientUserId: adjacentBooking.userId,
    createdByUserId: actorUserId || null,
    type: "gender-seat-alert",
    message: `${actorName} booked seat ${selectedSeatId} next to your seat ${adjacentSeatId}. You can change your seat if you prefer.`,
    metadata: {
      selectedSeatId,
      adjacentSeatId,
      canChangeSeat: true,
      actionLabel: "Change seat",
      secondaryActionLabel: "I prefer this seat",
      redirectTo: "/"
    }
  });
};

exports.createBooking = async (req, res) => {
  try {
    await releaseExpiredPendingBookings();

    const status = req.body?.status || "Booked";
    const paymentStatus = req.body?.paymentStatus || "Pending";
    const shouldLockSeat = isPendingStatus(status) && isPendingPaymentStatus(paymentStatus);

    const booking = await Booking.create({
      ...req.body,
      userId: req.user?.id,
      status,
      paymentStatus,
      lockExpiresAt: shouldLockSeat ? new Date(Date.now() + BOOKING_LOCK_MINUTES * 60 * 1000) : null,
      lockReleasedAt: null
    });

    await createAdjacentGenderAlertFromBooking({
      booking,
      actorUserId: req.user?.id
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBookedSeatSummary = async (req, res) => {
  try {
    await releaseExpiredPendingBookings();

    const { routeId, departureDate, travelDate } = req.query || {};

    if (!routeId) {
      return res.status(400).json({ error: "routeId is required" });
    }

    const filters = {
      routeId,
      status: { $regex: "^(pending|booked|confirmed|completed)$", $options: "i" }
    };

    if (departureDate) {
      filters.departureDate = departureDate;
    }
    if (travelDate) {
      filters.travelDate = travelDate;
    }

    const bookings = await Booking.find(filters)
      .select("seatNumber gender status")
      .sort({ createdAt: -1 });

    // Keep the latest booking per seat to avoid duplicates in edge cases.
    const bySeat = new Map();
    bookings.forEach((booking) => {
      const seatId = String(booking.seatNumber || "").trim().toUpperCase();
      if (!seatId || bySeat.has(seatId)) return;

      const gender = String(booking.gender || "").toLowerCase();
      const seatStatus =
        gender === "male"
          ? "booked-male"
          : gender === "female"
            ? "booked-female"
            : "booked";

      bySeat.set(seatId, {
        seatNumber: seatId,
        status: seatStatus
      });
    });

    res.json({
      routeId,
      count: bySeat.size,
      seats: Array.from(bySeat.values())
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyBookedSeats = async (req, res) => {
  try {
    await releaseExpiredPendingBookings();

    const { routeId, departureDate, travelDate } = req.query || {};

    const filters = {
      userId: String(req.user?.id || req.user?._id || ""),
      status: { $regex: "^(pending|booked|confirmed|completed)$", $options: "i" }
    };

    if (routeId) filters.routeId = routeId;
    if (departureDate) filters.departureDate = departureDate;
    if (travelDate) filters.travelDate = travelDate;

    const bookings = await Booking.find(filters)
      .select("seatNumber routeId departureDate travelDate status paymentStatus lockExpiresAt")
      .sort({ createdAt: -1 })
      .lean();

    const seatNumbers = Array.from(
      new Set(bookings.map((item) => String(item.seatNumber || "").trim().toUpperCase()).filter(Boolean))
    );

    const now = Date.now();
    const activeLocks = bookings
      .map((booking) => {
        const expiresAt = booking?.lockExpiresAt ? new Date(booking.lockExpiresAt).toISOString() : null;
        const status = String(booking?.status || "").toLowerCase();
        const paymentStatus = String(booking?.paymentStatus || "").toLowerCase();

        if (!expiresAt || status !== "pending" || paymentStatus !== "pending") return null;

        const expiresAtMs = new Date(expiresAt).getTime();
        if (!Number.isFinite(expiresAtMs) || expiresAtMs <= now) return null;

        return {
          seatNumber: String(booking?.seatNumber || "").trim().toUpperCase(),
          routeId: booking?.routeId || "",
          departureDate: booking?.departureDate || "",
          travelDate: booking?.travelDate || "",
          lockExpiresAt: expiresAt
        };
      })
      .filter(Boolean);

    res.json({
      count: seatNumbers.length,
      seats: seatNumbers,
      activeLocks,
      bookings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changeMySeat = async (req, res) => {
  try {
    await releaseExpiredPendingBookings();

    const { targetSeatId, replacementSeatId, notificationId, routeId, departureDate, travelDate } = req.body || {};

    const normalizedTargetSeat = String(targetSeatId || "").trim().toUpperCase();
    const normalizedReplacementSeat = String(replacementSeatId || "").trim().toUpperCase();

    if (!normalizedTargetSeat || !normalizedReplacementSeat) {
      return res.status(400).json({ error: "targetSeatId and replacementSeatId are required" });
    }

    if (normalizedTargetSeat === normalizedReplacementSeat) {
      return res.status(400).json({ error: "Replacement seat must be different" });
    }

    const currentUserId = String(req.user?.id || req.user?._id || "");

    const ownerFilters = {
      userId: currentUserId,
      seatNumber: normalizedTargetSeat,
      status: { $regex: "^(pending|booked|confirmed|completed)$", $options: "i" }
    };

    if (routeId) ownerFilters.routeId = routeId;
    if (departureDate) ownerFilters.departureDate = departureDate;
    if (travelDate) ownerFilters.travelDate = travelDate;

    const myBooking = await Booking.findOne(ownerFilters).sort({ createdAt: -1 });
    if (!myBooking) {
      return res.status(404).json({ error: "Target seat booking not found for this user" });
    }

    const routeScope = {
      routeId: myBooking.routeId,
      seatNumber: normalizedReplacementSeat,
      status: { $regex: "^(pending|booked|confirmed|completed)$", $options: "i" },
      _id: { $ne: myBooking._id }
    };

    if (myBooking.departureDate) routeScope.departureDate = myBooking.departureDate;
    if (myBooking.travelDate) routeScope.travelDate = myBooking.travelDate;

    const seatInUse = await Booking.exists(routeScope);
    if (seatInUse) {
      return res.status(409).json({ error: "Replacement seat is already booked" });
    }

    myBooking.seatNumber = normalizedReplacementSeat;
    await myBooking.save();

    const resolvedPayload = {
      isRead: true,
      message: `Seat changed successfully from ${normalizedTargetSeat} to ${normalizedReplacementSeat}.`,
      metadata: {
        selectedSeatId: normalizedReplacementSeat,
        adjacentSeatId: normalizedReplacementSeat,
        canChangeSeat: false,
        actionLabel: "",
        secondaryActionLabel: "",
        redirectTo: "/"
      }
    };

    const normalizedNotificationId = String(notificationId || "").trim();

    if (normalizedNotificationId) {
      await Notification.findOneAndUpdate(
        {
          _id: normalizedNotificationId,
          recipientUserId: currentUserId,
          type: "gender-seat-alert"
        },
        resolvedPayload
      );
    } else {
      // Fallback: resolve seat-change alerts tied to the old seat.
      await Notification.updateMany(
        {
          recipientUserId: currentUserId,
          type: "gender-seat-alert",
          isRead: false,
          "metadata.adjacentSeatId": normalizedTargetSeat
        },
        resolvedPayload
      );
    }

    res.json({
      message: "Seat changed successfully",
      booking: myBooking,
      previousSeat: normalizedTargetSeat,
      newSeat: normalizedReplacementSeat
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllBookings = async (req, res) => {
  await releaseExpiredPendingBookings();
  const bookings = await Booking.find();
  res.json(bookings);
}
exports.updateBooking = async (req, res) => {
  const updated = await Booking.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
}
exports.deleteBooking = async (req, res) => {
  await Booking.findByIdAndDelete(req.params.id);
  res.json({ message: "Booking removed" });
};
