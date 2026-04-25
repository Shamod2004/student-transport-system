const express = require("express");
const router = express.Router();
const {
	createPayment,
	getAllPayments,
	getPaymentById,
	updatePayment,
	deletePayment
} = require("../controllers/paymentController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, getAllPayments);
router.get("/:id", requireAuth, getPaymentById);
router.post("/", requireAuth, createPayment);
router.put("/:id", requireAuth, updatePayment);
router.delete("/:id", requireAuth, deletePayment);

module.exports = router;
