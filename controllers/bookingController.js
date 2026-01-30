const Booking = require("../models/Booking");
const Slot = require("../models/Slot");
const Joi = require("joi");

// Validation schemas
const createBookingSchema = Joi.object({
  slotId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid slot ID format",
      "any.required": "Slot ID is required",
    }),
});

const bookingIdSchema = Joi.object({
  bookingId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid booking ID format",
      "any.required": "Booking ID is required",
    }),
});

exports.createBooking = async (req, res) => {
  try {
    // Check customer role
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Customers only" });
    }

    // Validate request body
    const { error, value } = createBookingSchema.validate(req.body, {
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

    // Find slot
    const slot = await Slot.findById(slotId);

    if (!slot || !slot.isActive) {
      return res.status(400).json({ message: "Slot unavailable" });
    }

    if (slot.bookedSeats >= slot.maxSeats) {
      return res.status(400).json({ message: "Slot full" });
    }

    // Check for duplicate booking (same user, same slot)
    const existingBooking = await Booking.findOne({
      userId: req.user.id,
      slotId: slotId,
      status: { $ne: "cancelled" }, // Not cancelled
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "You have already booked this slot",
      });
    }

    // Increment booked seats
    slot.bookedSeats++;
    await slot.save();

    // Create booking
    const booking = await Booking.create({
      userId: req.user.id,
      slotId,
      bookingDate: slot.date,
    });

    // Populate slot details before sending response
    await booking.populate("slotId");

    res.status(201).json(booking);
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.myBookings = async (req, res) => {
  try {
    // Customer check
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Customers only" });
    }

    const bookings = await Booking.find({ userId: req.user.id })
      .populate("slotId")
      .sort({ createdAt: -1 }); // Newest first

    res.json(bookings);
  } catch (error) {
    console.error("Get my bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    // Admin check
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const bookings = await Booking.find()
      .populate("slotId")
      .populate("userId", "-password") // Exclude password
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    // Validate booking ID from params
    const { error, value } = bookingIdSchema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors,
      });
    }

    const { bookingId } = value;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Authorization: user OR admin
    if (
      req.user.role !== "admin" &&
      booking.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Check if already cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking already cancelled" });
    }

    // Update booking status
    booking.status = "cancelled";
    await booking.save();

    // Restore seat
    const slot = await Slot.findById(booking.slotId);
    if (slot && slot.bookedSeats > 0) {
      slot.bookedSeats -= 1;
      await slot.save();
    }

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
