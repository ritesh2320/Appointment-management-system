const Slot = require("../models/Slot");
const Joi = require("joi");

// Validation schema
const createSlotSchema = Joi.object({
  date: Joi.date().iso().min("now").required().messages({
    "date.base": "Please provide a valid date",
    "date.min": "Date cannot be in the past",
    "any.required": "Date is required",
  }),

  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM|am|pm))?$/)
    .required()
    .messages({
      "string.pattern.base":
        "Please provide start time in valid format (e.g., 10:00 or 10:00 AM)",
      "any.required": "Start time is required",
    }),

  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM|am|pm))?$/)
    .required()
    .messages({
      "string.pattern.base":
        "Please provide end time in valid format (e.g., 11:00 or 11:00 AM)",
      "any.required": "End time is required",
    }),

  maxSeats: Joi.number().integer().min(1).max(1000).required().messages({
    "number.base": "Max seats must be a number",
    "number.min": "Max seats must be at least 1",
    "number.max": "Max seats cannot exceed 1000",
    "any.required": "Max seats is required",
  }),

  bookedSeats: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Booked seats must be a number",
    "number.min": "Booked seats cannot be negative",
  }),

  isActive: Joi.boolean().default(true),
});

exports.createSlot = async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    // Validate request body
    const { error, value } = createSlotSchema.validate(req.body, {
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

    // Check for duplicate slot (same date, startTime, and endTime)
    const existingSlot = await Slot.findOne({
      date: value.date,
      startTime: value.startTime,
      endTime: value.endTime,
    });

    if (existingSlot) {
      return res.status(400).json({
        message: "A slot already exists for this date and time range",
      });
    }

    // Create slot
    const slot = await Slot.create(value);
    res.status(201).json(slot);
  } catch (err) {
    console.error("Create slot error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const slots = await Slot.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $match: {
          $expr: {
            $lt: ["$bookedSeats", "$maxSeats"],
          },
        },
      },
      {
        $sort: { date: 1, startTime: 1 }, // Sort by date and start time
      },
    ]);

    res.json(slots);
  } catch (error) {
    console.error("Get slots error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
