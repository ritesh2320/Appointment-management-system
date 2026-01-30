const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

// Create payment intent (Razorpay)
router.post(
  "/create-intent",
  authMiddleware,
  paymentController.createPaymentIntent,
);

// Verify payment and create booking
router.post("/verify", authMiddleware, paymentController.verifyPayment);

// Get payment status
router.get(
  "/:paymentIntentId",
  authMiddleware,
  paymentController.getPaymentStatus,
);

// Get my payments (customer)
router.get("/my/list", authMiddleware, paymentController.getMyPayments);

// Get all payments (admin)
router.get("/admin/all", authMiddleware, paymentController.getAllPayments);

// Refund payment (admin)
router.post(
  "/:paymentId/refund",
  authMiddleware,
  paymentController.refundPayment,
);

module.exports = router;
