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
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },
    bookingDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "completed"],
      default: "confirmed",
    },

    tokenNumber: {
      type: Number, // 1, 2, 3... 20
      required: true,
    },

    tokenId: {
      type: String, // "T-01", "T-02"... "T-20"
      required: true,
    },

    appointmentTime: {
      type: String, // "07:40", "07:46", "07:52"...
      required: true,
    },

    appointmentEndTime: {
      type: String, // "07:46", "07:52"...
      required: true,
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
bookingSchema.index({ patientId: 1 }); // Index for patient queries

// Prevent duplicate bookings for the same patient and slot
bookingSchema.index(
  { patientId: 1, slotId: 1 },
  { 
    unique: true, 
    partialFilterExpression: { patientId: { $type: "objectId" } } 
  }
);

// Prevent duplicate bookings for the same user and slot (for patient bookings)
bookingSchema.index(
  { userId: 1, slotId: 1 },
  { 
    unique: true, 
    partialFilterExpression: { patientId: { $type: "null" } } 
  }
);

// module.exports = mongoose.model("Booking", bookingSchema);
module.exports =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
