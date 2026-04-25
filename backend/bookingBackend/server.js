const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
require("dotenv").config();
const connectDB = require("./config/db");
const { releaseExpiredHoldsJob } = require("./controllers/seatController");
const { releaseExpiredPendingBookingsJob } = require("./controllers/bookingController");
const User = require("./models/User");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  })
);
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ limit: "12mb", extended: true }));

app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/seats", require("./routes/seatRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/routes", require("./routes/routeRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
// app.use("/api/driver-maintenance", require("./routes/driverMaintenanceRoutes"));

app.use((err, _req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload too large. Reduce request size and try again." });
  }
  return next(err);
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5001;

const ensureAdminUser = async () => {
  const adminEmail = "admin@gmail.com";
  const adminPassword = "123456";
  const adminName = "Booking Admin";

  const normalizedEmail = adminEmail.toLowerCase();
  let existing = await User.findOne({ email: normalizedEmail });

  if (!existing) {
    await User.create({
      name: adminName,
      email: normalizedEmail,
      password: adminPassword,
      role: "admin",
      adminType: "general"
    });
    console.log("General booking admin user created");
    return;
  }

  let shouldSave = false;

  if (existing.role !== "admin") {
    existing.role = "admin";
    shouldSave = true;
  }

  if (existing.adminType !== "general") {
    existing.adminType = "general";
    shouldSave = true;
  }

  if (existing.name !== adminName) {
    existing.name = adminName;
    shouldSave = true;
  }

  const passwordMatches = await existing.comparePassword(adminPassword);
  if (!passwordMatches) {
    existing.password = adminPassword;
    shouldSave = true;
  }

  if (shouldSave) {
    await existing.save();
    console.log("General booking admin user synchronized");
  }
};

const ensureDriverMaintenanceAdmin = async () => {
  const adminEmail = "seneth@gmail.com";
  const adminPassword = "12345678";
  const adminName = "Driver Admin";

  const normalizedEmail = adminEmail.toLowerCase();
  let existing = await User.findOne({ email: normalizedEmail });

  if (!existing) {
    await User.create({
      name: adminName,
      email: normalizedEmail,
      password: adminPassword,
      role: "admin",
      adminType: "driver-maintenance"
    });
    console.log("Driver maintenance admin user created");
    return;
  }

  let shouldSave = false;

  if (existing.role !== "admin") {
    existing.role = "admin";
    shouldSave = true;
  }

  if (existing.adminType !== "driver-maintenance") {
    existing.adminType = "driver-maintenance";
    shouldSave = true;
  }

  if (existing.name !== adminName) {
    existing.name = adminName;
    shouldSave = true;
  }

  const passwordMatches = await existing.comparePassword(adminPassword);
  if (!passwordMatches) {
    existing.password = adminPassword;
    shouldSave = true;
  }

  if (shouldSave) {
    await existing.save();
    console.log("Driver maintenance admin user synchronized");
  }
};

const ensureRouteManagementAdmin = async () => {
  const adminEmail = "minura@gmail.com";
  const adminPassword = "123456";
  const adminName = "Route Admin";

  const normalizedEmail = adminEmail.toLowerCase();
  let existing = await User.findOne({ email: normalizedEmail });

  if (!existing) {
    await User.create({
      name: adminName,
      email: normalizedEmail,
      password: adminPassword,
      role: "admin",
      adminType: "route-management"
    });
    console.log("Route management admin user created");
    return;
  }

  let shouldSave = false;

  if (existing.role !== "admin") {
    existing.role = "admin";
    shouldSave = true;
  }

  if (existing.adminType !== "route-management") {
    existing.adminType = "route-management";
    shouldSave = true;
  }

  if (existing.name !== adminName) {
    existing.name = adminName;
    shouldSave = true;
  }

  const passwordMatches = await existing.comparePassword(adminPassword);
  if (!passwordMatches) {
    existing.password = adminPassword;
    shouldSave = true;
  }

  if (shouldSave) {
    await existing.save();
    console.log("Route management admin user synchronized");
  }
};

const startServer = async () => {
  try {
    await connectDB();

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });
    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });

    await ensureAdminUser();
    await ensureDriverMaintenanceAdmin();
    await ensureRouteManagementAdmin();
    server.listen(PORT, () =>
      console.log(`Server running on ${PORT}`)
    );
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
};

startServer();

setInterval(() => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  releaseExpiredHoldsJob(io).catch((err) => {
    console.error("Release job failed:", err.message);
  });
}, 30 * 1000);

setInterval(() => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  releaseExpiredPendingBookingsJob().catch((err) => {
    console.error("Pending booking release job failed:", err.message);
  });
}, 30 * 1000);
