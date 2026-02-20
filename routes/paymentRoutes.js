const express = require("express");
const router = express.Router();
const { createPaymentIntent, verifyPayment, getMyPayments, getAllPayments, refundPayment, getPaymentStatus } = require("../controllers/paymentController");
const {
  authenticate,
  authorizeAdmin,
} = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

// Rate limiter for payment creation — prevents abuse (max 10 attempts per 15 min per IP)
const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many payment requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Patient Routes ───────────────────────────────────────────────

// Create Razorpay order
router.post(
  "/create-intent",
  authenticate,
  paymentRateLimiter,
 createPaymentIntent
);

// Verify payment & confirm booking
router.post(
  "/verify",
  authenticate,
  paymentRateLimiter,
  verifyPayment
);

// Get logged-in patient's payment history
// NOTE: defined before /:paymentIntentId to avoid route conflict
router.get("/my/list", authenticate, getMyPayments);

// ─── Admin Routes ─────────────────────────────────────────────────

// Get all payments
router.get(
  "/admin/all",
  authenticate,
  authorizeAdmin,
  getAllPayments
);

// Refund a payment
router.post(
  "/admin/:paymentId/refund",
  authenticate,
  authorizeAdmin,
  refundPayment
);

// ─── Shared Routes ────────────────────────────────────────────────

// Get payment status by Razorpay order ID (patient sees own, admin sees all)
router.get(
  "/:paymentIntentId",
  authenticate,
  getPaymentStatus
);

module.exports = router;