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

  return {
    ...plain,
    price: typeof plain.price === "object" && plain.price !== null ? Number(plain.price) : plain.price,
    ...stats
  };
};

const toPlainRoute = (route) => {
  const plain = route.toObject ? route.toObject() : route;
  return {
    ...plain,
    price: typeof plain.price === "object" && plain.price !== null ? Number(plain.price) : plain.price
  };
};

const buildRouteQuery = (query) => {
  const filters = {};

  if (query.search) {
    filters.$or = [
      { busId: { $regex: query.search, $options: "i" } },
      { routeName: { $regex: query.search, $options: "i" } },
      { departureLocation: { $regex: query.search, $options: "i" } },
      { arrivalLocation: { $regex: query.search, $options: "i" } },
      { busType: { $regex: query.search, $options: "i" } }
    ];
  }

  if (query.from) {
    filters.departureLocation = { $regex: query.from, $options: "i" };
  }

  if (query.to) {
    filters.arrivalLocation = { $regex: query.to, $options: "i" };
  }

  if (query.status) {
    filters.status = query.status;
  }

  if (query.startDate || query.endDate) {
    filters.departureDate = {};
    if (query.startDate) {
      filters.departureDate.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filters.departureDate.$lte = new Date(query.endDate);
    }
  }

  return filters;
};

exports.getAllRoutes = async (req, res) => {
  try {
    await releaseExpiredPendingBookingsJob();

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;
    const filters = buildRouteQuery(req.query);

    const [routes, totalRoutes] = await Promise.all([
      Route.find(filters).sort({ departureDate: 1, departureTime: 1 }).skip(skip).limit(limit),
      Route.countDocuments(filters)
    ]);

    const routesWithStats = await Promise.all(routes.map((route) => withSeatStats(route)));

    res.json({
      success: true,
      data: {
        routes: routesWithStats,
        summary: {
          totalRoutes,
          totalBuses: totalRoutes,
          certified: routes.filter((route) => route.status === "Certified").length,
          pending: routes.filter((route) => route.status === "Pending").length
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRoutes / limit),
          totalRoutes,
          limit,
          hasNextPage: page * limit < totalRoutes,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRouteById = async (req, res) => {
  try {
    await releaseExpiredPendingBookingsJob();

    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    res.json({ success: true, data: await withSeatStats(route) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRoute = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      busId: String(req.body.busId || "").trim().toUpperCase(),
      departureDate: req.body.departureDate ? new Date(req.body.departureDate) : undefined,
      price: req.body.price !== undefined ? Number(req.body.price) : 0
    };

    if (!payload.busId) {
      return res.status(400).json({ success: false, message: "Bus ID is required" });
    }

    const existingRoute = await Route.findOne({ busId: payload.busId });
    if (existingRoute) {
      return res.status(400).json({ success: false, message: "Bus ID already exists" });
    }

    const newRoute = await Route.create(payload);
    res.status(201).json({ success: true, message: "Route created successfully", data: toPlainRoute(newRoute) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const existingRoute = await Route.findById(req.params.id);
    if (!existingRoute) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    const updateData = { ...req.body };
    if (updateData.busId) {
      updateData.busId = String(updateData.busId).trim().toUpperCase();
      const duplicateRoute = await Route.findOne({ busId: updateData.busId, _id: { $ne: req.params.id } });
      if (duplicateRoute) {
        return res.status(400).json({ success: false, message: "Bus ID already exists" });
      }
    }
    if (updateData.departureDate) {
      updateData.departureDate = new Date(updateData.departureDate);
    }
    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
    }

    const updatedRoute = await Route.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, message: "Route updated successfully", data: toPlainRoute(updatedRoute) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    await Route.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Route deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUniqueLocations = async (_req, res) => {
  try {
    const departureLocations = await Route.distinct("departureLocation");
    const arrivalLocations = await Route.distinct("arrivalLocation");

    res.json({
      success: true,
      data: {
        departureLocations,
        arrivalLocations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getScheduleByDate = async (req, res) => {
  try {
    await releaseExpiredPendingBookingsJob();

    const selectedDate = req.query.date || req.query.departureDate;
    const matchDate = selectedDate ? new Date(selectedDate) : new Date();
    const startDate = new Date(matchDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(matchDate);
    endDate.setHours(23, 59, 59, 999);

    const routes = await Route.find({ departureDate: { $gte: startDate, $lte: endDate } });

    const routesWithStats = await Promise.all(routes.map((route) => withSeatStats(route)));

    res.json({
      success: true,
      data: {
        routes: routesWithStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBusesByRoute = async (req, res) => {
  try {
    await releaseExpiredPendingBookingsJob();

    const routeName = decodeURIComponent(req.params.routeName || "");
    const routes = await Route.find({
      $or: [
        { routeName: { $regex: routeName, $options: "i" } },
        { departureLocation: { $regex: routeName, $options: "i" } },
        { arrivalLocation: { $regex: routeName, $options: "i" } }
      ]
    });

    const routesWithStats = await Promise.all(routes.map((route) => withSeatStats(route)));

    res.json({
      success: true,
      data: {
        routes: routesWithStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRouteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updatedRoute = await Route.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!updatedRoute) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    res.json({ success: true, message: "Route status updated successfully", data: toPlainRoute(updatedRoute) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
