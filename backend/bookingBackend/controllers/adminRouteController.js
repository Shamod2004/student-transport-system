const Route = require("../models/Route");
const Booking = require("../models/Booking");
const { releaseExpiredPendingBookingsJob } = require("./bookingController");

const DEFAULT_TOTAL_SEATS = 40;

const toDateKey = (value) => {
  if (!value) return "";

  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const getRouteSeatStats = async (routeId, routeDateKey) => {
  if (!routeId) {
    return {
      totalSeats: DEFAULT_TOTAL_SEATS,
      bookedSeats: 0,
      availableSeats: DEFAULT_TOTAL_SEATS
    };
  }

  const bookings = await Booking.find({
    routeId: String(routeId),
    status: { $regex: "^(pending|booked|confirmed|completed)$", $options: "i" }
  })
    .select("seatNumber departureDate travelDate createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const latestSeatById = new Map();
  bookings.forEach((booking) => {
    const seatId = String(booking?.seatNumber || "").trim().toUpperCase();
    if (!seatId || latestSeatById.has(seatId)) return;

    const bookingDateKey = toDateKey(booking?.departureDate) || toDateKey(booking?.travelDate);
    if (routeDateKey && bookingDateKey && bookingDateKey !== routeDateKey) return;

    latestSeatById.set(seatId, true);
  });

  const totalSeats = DEFAULT_TOTAL_SEATS;
  const bookedSeats = latestSeatById.size;
  const availableSeats = Math.max(0, totalSeats - bookedSeats);

  return { totalSeats, bookedSeats, availableSeats };
};

const withSeatStats = async (route) => {
  const plain = route.toObject ? route.toObject() : route;
  const routeDateKey = toDateKey(plain?.departureDate);
  const stats = await getRouteSeatStats(plain?._id || plain?.id, routeDateKey);
  return { ...plain, ...stats };
};

const buildFilters = (query) => {
  const { search, from, to, date, status } = query;
  const filters = {};

  if (search) {
    filters.$or = [
      { busId: { $regex: search, $options: "i" } },
      { routeName: { $regex: search, $options: "i" } },
      { departureLocation: { $regex: search, $options: "i" } },
      { arrivalLocation: { $regex: search, $options: "i" } }
    ];
  }

  if (from) {
    filters.departureLocation = { $regex: from, $options: "i" };
  }

  if (to) {
    filters.arrivalLocation = { $regex: to, $options: "i" };
  }

  if (status) {
    filters.status = status;
  }

  if (date) {
    const selectedDate = new Date(date);
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);
    filters.departureDate = { $gte: start, $lte: end };
  }

  return filters;
};

exports.getAllRoutes = async (req, res) => {
  try {
    await releaseExpiredPendingBookingsJob();

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;
    const filters = buildFilters(req.query);

    const [routes, total] = await Promise.all([
      Route.find(filters).sort({ departureDate: 1, departureTime: 1 }).skip(skip).limit(limit),
      Route.countDocuments(filters)
    ]);

    const routesWithStats = await Promise.all(routes.map((route) => withSeatStats(route)));

    res.json({
      routes: routesWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRouteById = async (req, res) => {
  try {
    await releaseExpiredPendingBookingsJob();

    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.json(await withSeatStats(route));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRoute = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      busId: String(req.body.busId || "").trim().toUpperCase()
    };

    if (!payload.busId) {
      return res.status(400).json({ error: "Bus ID is required" });
    }

    const existing = await Route.findOne({ busId: payload.busId });
    if (existing) {
      return res.status(400).json({ error: "Bus ID already exists" });
    }

    const route = await Route.create(payload);
    res.status(201).json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.busId) {
      payload.busId = String(payload.busId).trim().toUpperCase();
      const duplicate = await Route.findOne({
        busId: payload.busId,
        _id: { $ne: req.params.id }
      });
      if (duplicate) {
        return res.status(400).json({ error: "Bus ID already exists" });
      }
    }

    const updated = await Route.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.json({ message: "Route deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
