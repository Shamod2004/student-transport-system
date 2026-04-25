const express = require("express");
const router = express.Router();
const controller = require("../controllers/bookingController");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/seat-summary", controller.getBookedSeatSummary);
router.get("/my-seats", requireAuth, controller.getMyBookedSeats);
router.post("/change-seat", requireAuth, controller.changeMySeat);
router.post("/", requireAuth, controller.createBooking);
router.get("/", requireAuth, requireRole("admin"), controller.getAllBookings);
router.put("/:id", requireAuth, requireRole("admin"), controller.updateBooking);
router.delete("/:id", requireAuth, requireRole("admin"), controller.deleteBooking);

module.exports = router;
