const Booking = require("../models/booking");
const Slot = require("../models/slot");
const Payment = require("../models/payment");
const User = require("../models/user");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { createPaymentIntentSchema, verifyPaymentSchema } = require("../validations/paymentValidations");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// Auto-refund helper — used when slot becomes unavailable after successful payment
const processAutoRefund = async (razorpayPaymentId, amount, reason) => {
  try {
    const refund = await razorpay.payments.refund(razorpayPaymentId, { amount });
    console.log(`Auto-refund processed for ${razorpayPaymentId}: ${reason}`, refund.id);
    return refund;
  } catch (err) {
    console.error(`Auto-refund FAILED for ${razorpayPaymentId}:`, err.message);
    return null;
  }
};



// ========================================
// CREATE PAYMENT INTENT (RAZORPAY)
// ========================================

exports.createPaymentIntent = async (req, res) => {
  try {
    // Only users can make payments
    if (req.user.role !== "patient") {
      return res.status(403).json({ message: "patients only" });
    }

    // Validate request
    const { error, value } = createPaymentIntentSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
      });
    }

    const { slotId } = value;

    // Verify slot exists and is available
    const slot = await Slot.findById(slotId);
    const user = await User.findById(req.user.id);
    // console.log("slot====",slot);
    // console.log("user====",user);

    if (!slot || !slot.isActive) {
      return res.status(400).json({ message: "Slot unavailable" });
    }

    if (slot.bookedSeats >= slot.maxSeats) {
      return res.status(400).json({ message: "Slot full" });
    }

    // Check for duplicate booking
    const existingBooking = await Booking.findOne({
      userId: req.user.id,
      slotId: slotId,
      status: { $ne: "cancelled" },
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "You have already booked this slot",
      });
    }

    // Calculate amount (in paise for INR)
    const amount = slot.price || 1000; // Default ₹10 if no price set
    const currency = "INR"; // Fixed for Razorpay

    // Create Razorpay order
    const options = {
      amount: amount, // Amount in paise
      currency: currency,
      receipt: `rcpt_${req.user.id}_${Date.now()}`.substring(0, 40), // max 40 chars
      notes: {
        userId: req.user.id,
        slotId: slotId,
        userName: user.name || "Unknown",
        slotDate: slot.date.toISOString(),
        slotTime: `${slot.startTime} - ${slot.endTime}`,
      },
    };

    // console.log("options====",options);

    const razorpayOrder = await razorpay.orders.create(options);

    // Create pending payment record
    const payment = await Payment.create({
      userId: req.user.id,
      slotId: slotId,
      amount: amount,
      currency: currency,
      paymentMethod: "razorpay",
      paymentIntentId: razorpayOrder.id,
      status: "pending",
    });

    return res.status(200).json({
      orderId: razorpayOrder.id,
      amount: amount,
      currency: currency,
      paymentMethod: "razorpay",
      key: process.env.RAZORPAY_KEY_ID, // Send public key to frontend
    });
  } catch (err) {
    console.error("Create payment intent error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ========================================
// VERIFY PAYMENT AND CREATE BOOKING
// ========================================

exports.verifyPayment = async (req, res) => {
  try {
    // Validate request
    const { error, value } = verifyPaymentSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
      });
    }

    const {
      paymentIntentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = value;

    // Find payment record
    const payment = await Payment.findOne({ paymentIntentId });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (payment.status === "succeeded") {
      return res.status(400).json({ message: "Payment already verified" });
    }

    // RAZORPAY SIGNATURE VERIFICATION

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      // Mark payment as failed
      payment.status = "failed";
      await payment.save();
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Signature is valid - proceed with payment success
    payment.status = "succeeded";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.paidAt = new Date();
    await payment.save();

    // CREATE BOOKING AFTER SUCCESSFUL PAYMENT
    const slot = await Slot.findById(payment.slotId);

    if (!slot || !slot.isActive) {
      // Slot gone — auto-refund
      if (payment.razorpayPaymentId) {
        await processAutoRefund(payment.razorpayPaymentId, payment.amount, "Slot unavailable after payment");
        payment.refundStatus = "refunded";
        payment.refundedAt = new Date();
        await payment.save();
      }
      return res.status(400).json({
        message: "Slot is no longer available. Your payment has been refunded automatically.",
      });
    }

    if (slot.bookedSeats >= slot.maxSeats) {
      // Slot full — auto-refund
      if (payment.razorpayPaymentId) {
        await processAutoRefund(payment.razorpayPaymentId, payment.amount, "Slot full after payment");
        payment.refundStatus = "refunded";
        payment.refundedAt = new Date();
        await payment.save();
      }
      return res.status(400).json({
        message: "Slot is now fully booked. Your payment has been refunded automatically.",
      });
    }

    // Check for race condition - another booking might have been created
    const duplicateBooking = await Booking.findOne({
      userId: payment.userId,
      slotId: payment.slotId,
      status: { $ne: "cancelled" },
    });

    if (duplicateBooking) {
      return res.status(400).json({
        message: "Booking already exists for this slot",
      });
    }

    // Increment booked seats
    slot.bookedSeats += 1;
    await slot.save();

    // Create booking
    const booking = await Booking.create({
      userId: payment.userId,
      slotId: payment.slotId,
      bookingDate: slot.date,
      status: "confirmed",
      paymentId: payment._id,
    });

    // Update payment with booking reference
    payment.bookingId = booking._id;
    await payment.save();

    // Populate slot details
    await booking.populate("slotId");

    return res.status(201).json({
      message: "Payment verified and booking confirmed",
      booking: booking,
      payment: {
        id: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paidAt,
      },
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ========================================
// GET PAYMENT STATUS
// ========================================

exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const payment = await Payment.findOne({ paymentIntentId })
      .populate("slotId")
      .populate("bookingId");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      payment.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(payment);
  } catch (err) {
    console.error("Get payment status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ========================================
// GET USER PAYMENTS
// ========================================

exports.getMyPayments = async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ message: "users only" });
    }

    const payments = await Payment.find({ userId: req.user.id })
      .populate("slotId")
      .populate("bookingId")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error("Get my payments error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ========================================
// GET ALL PAYMENTS (ADMIN)
// ========================================

exports.getAllPayments = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const payments = await Payment.find()
      .populate("userId", "-password")
      .populate("slotId")
      .populate("bookingId")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error("Get all payments error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ========================================
// REFUND PAYMENT (ADMIN)
// ========================================

exports.refundPayment = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "succeeded") {
      return res
        .status(400)
        .json({ message: "Payment not eligible for refund" });
    }

    if (payment.refundStatus === "refunded") {
      return res.status(400).json({ message: "Payment already refunded" });
    }

    // Check if razorpayPaymentId exists
    if (!payment.razorpayPaymentId) {
      return res.status(400).json({
        message: "Razorpay payment ID not found. Cannot process refund.",
      });
    }

    let refund;

    // RAZORPAY REFUND
    try {
      refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: payment.amount,
      });

      payment.refundStatus = "refunded";
      payment.refundId = refund.id;
      payment.refundedAt = new Date();
      await payment.save();
    } catch (refundError) {
      console.error("Razorpay refund error:", refundError);
      payment.refundStatus = "failed";
      await payment.save();
      return res.status(500).json({
        message: "Refund processing failed",
        error: refundError.message,
      });
    }

    // Cancel associated booking if exists
    if (payment.bookingId) {
      const booking = await Booking.findById(payment.bookingId);
      if (booking && booking.status !== "cancelled") {
        booking.status = "cancelled";
        await booking.save();

        // Restore seat
        const slot = await Slot.findById(booking.slotId);
        if (slot && slot.bookedSeats > 0) {
          slot.bookedSeats -= 1;
          await slot.save();
        }
      }
    }

    res.json({
      message: "Refund processed successfully",
      payment: payment,
      refund: refund,
    });
  } catch (err) {
    console.error("Refund payment error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = exports;