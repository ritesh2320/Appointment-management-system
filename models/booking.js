const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "completed"],
      default: "confirmed",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ slotId: 1 });
bookingSchema.index({ createdAt: -1 });

// Prevent duplicate bookings for the same user and slot
bookingSchema.index({ userId: 1, slotId: 1 }, { unique: true });

// module.exports = mongoose.model("Booking", bookingSchema);
module.exports =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
