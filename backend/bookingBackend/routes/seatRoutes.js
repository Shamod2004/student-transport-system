const express = require("express");
const router = express.Router();
const controller = require("../controllers/seatController");

router.get("/:busId", controller.getSeatsByBus);
router.post("/hold-seat", controller.holdSeat);
router.post("/book-seat", controller.bookSeat);
router.post("/release-expired", controller.releaseExpiredHolds);

module.exports = router;
