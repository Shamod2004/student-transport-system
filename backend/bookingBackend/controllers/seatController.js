const Seat = require("../models/Seat");

const HOLD_MINUTES = 5;

const emitSeatUpdated = (io, seat) => {
  if (!io || !seat) return;
  io.emit("seatUpdated", {
    busId: seat.busId,
    seatNumber: seat.seatNumber,
    status: seat.status,
    heldBy: seat.heldBy,
    holdExpiresAt: seat.holdExpiresAt
  });
};

exports.getSeatsByBus = async (req, res) => {
  try {
    const seats = await Seat.find({ busId: req.params.busId }).sort({ seatNumber: 1 });
    res.json(seats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.holdSeat = async (req, res) => {
  try {
    const { busId, seatNumber, userId } = req.body;

    if (!busId || !seatNumber || !userId) {
      return res.status(400).json({ error: "busId, seatNumber, and userId are required" });
    }

    const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

    const now = new Date();

    // Atomic hold to prevent race conditions.
    const seat = await Seat.findOneAndUpdate(
      {
        busId,
        seatNumber,
        $or: [
          { status: "available" },
          { status: "held", holdExpiresAt: { $lte: now } }
        ]
      },
      { status: "held", heldBy: userId, holdExpiresAt },
      { new: true }
    );

    if (!seat) {
      return res.status(409).json({ error: "Seat is not available" });
    }

    emitSeatUpdated(req.app.get("io"), seat);
    res.json(seat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bookSeat = async (req, res) => {
  try {
    const { busId, seatNumber, userId } = req.body;

    if (!busId || !seatNumber || !userId) {
      return res.status(400).json({ error: "busId, seatNumber, and userId are required" });
    }

    const now = new Date();

    const seat = await Seat.findOneAndUpdate(
      {
        busId,
        seatNumber,
        status: "held",
        heldBy: userId,
        holdExpiresAt: { $gt: now }
      },
      { status: "booked", heldBy: null, holdExpiresAt: null },
      { new: true }
    );

    if (!seat) {
      return res.status(409).json({ error: "Seat is not held by this user or hold expired" });
    }

    emitSeatUpdated(req.app.get("io"), seat);
    res.json(seat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Release expired holds and notify all clients.
const releaseExpiredHoldsInternal = async (io) => {
  const now = new Date();
  const expiredSeats = await Seat.find({ status: "held", holdExpiresAt: { $lte: now } });

  if (expiredSeats.length === 0) {
    return { released: 0 };
  }

  await Seat.updateMany(
    { _id: { $in: expiredSeats.map((seat) => seat._id) } },
    { status: "available", heldBy: null, holdExpiresAt: null }
  );

  expiredSeats.forEach((seat) => {
    emitSeatUpdated(io, {
      ...seat.toObject(),
      status: "available",
      heldBy: null,
      holdExpiresAt: null
    });
  });

  return { released: expiredSeats.length };
};

exports.releaseExpiredHolds = async (req, res) => {
  try {
    const result = await releaseExpiredHoldsInternal(req.app.get("io"));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.releaseExpiredHoldsJob = async (io) => {
  return releaseExpiredHoldsInternal(io);
};
