const express = require("express");
const router = express.Router();
const studentController = require("../controllers/adminStudentController");
const bookingController = require("../controllers/adminBookingController");
const routeController = require("../controllers/adminRouteController");
const paymentController = require("../controllers/paymentController");

// Student Registration CRUD routes
router.get("/students", studentController.getAllStudents);
router.get("/students/search", studentController.searchStudents);
router.get("/students/:id", studentController.getStudentById);
router.post("/students", studentController.createStudent);
router.put("/students/:id", studentController.updateStudent);
router.delete("/students/:id", studentController.deleteStudent);

// Booking Management CRUD routes
router.get("/bookings", bookingController.getAllBookings);
router.get("/bookings/search", bookingController.searchBookings);
router.get("/bookings/stats", bookingController.getBookingStats);
router.get("/bookings/:id", bookingController.getBookingById);
router.post("/bookings", bookingController.createBooking);
router.put("/bookings/:id", bookingController.updateBooking);
router.put("/bookings/:id/status", bookingController.updateBookingStatus);
router.delete("/bookings/:id", bookingController.deleteBooking);

// Route Management CRUD routes
router.get("/routes", routeController.getAllRoutes);
router.get("/routes/:id", routeController.getRouteById);
router.post("/routes", routeController.createRoute);
router.put("/routes/:id", routeController.updateRoute);
router.delete("/routes/:id", routeController.deleteRoute);

// Payment Management CRUD routes
router.get("/payments", paymentController.getAllPayments);
router.get("/payments/:id", paymentController.getPaymentById);
router.post("/payments", paymentController.createPayment);
router.put("/payments/:id", paymentController.updatePayment);
router.delete("/payments/:id", paymentController.deletePayment);

module.exports = router;
