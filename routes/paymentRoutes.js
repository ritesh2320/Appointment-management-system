const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const {
  authenticate,
  authorizeAdmin,
} = require("../middleware/authMiddleware");

// Create payment intent (Razorpay)
router.post(
  "/create-intent",
  authenticate,
  paymentController.createPaymentIntent,
);

// Verify payment and create booking
router.post("/verify", authenticate, paymentController.verifyPayment);

// Get my payments (patient) - must come before /:paymentIntentId to avoid route conflicts
router.get("/my/list", authenticate, paymentController.getMyPayments);

// Get all payments (admin)
router.get("/admin/all", authenticate, authorizeAdmin, paymentController.getAllPayments);

// Get payment status
router.get(
  "/:paymentIntentId",
  authenticate,
  paymentController.getPaymentStatus,
);

// Refund payment (admin)
router.post(
  "/:paymentId/refund",
  authenticate,
  authorizeAdmin,
  paymentController.refundPayment,
);

module.exports = router;