const Slot = require("../models/slot");
const {
  createSlotSchema,
  slotIdSchema,
  getAvailableSlotsQuerySchema,
} = require("../validations/slotValidations");

// ================== CONTROLLER FUNCTIONS ==================

/**
 * @desc    Create new slot
 * @route   POST /api/slots
 * @access  Admin
 */
exports.createSlot = async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only",
      });
    }

    // Validate request body
    const { error, value } = createSlotSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((detail) => detail.message),
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
        success: false,
        message: "A slot already exists for this date and time range",
      });
    }

    // Create slot
    const slot = await Slot.create(value);

    res.status(201).json({
      success: true,
      message: "Slot created successfully",
      data: slot,
    });
  } catch (err) {
    console.error("Create slot error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

/**
 * @desc    Get available slots (for patients/users)
 * @route   GET /api/slots/available
 * @access  Public/Patient
 */
exports.getAvailableSlots = async (req, res) => {
  try {
    //  NEW: Validate query parameters
    const { error, value } = getAvailableSlotsQuerySchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { date, startDate, endDate, limit } = value;

    // Build match conditions
    const matchConditions = { isActive: true };

    // Add date filters if provided
    if (date) {
      matchConditions.date = new Date(date);
    }

    if (startDate || endDate) {
      matchConditions.date = {};
      if (startDate) {
        matchConditions.date.$gte = new Date(startDate);
      }
      if (endDate) {
        matchConditions.date.$lte = new Date(endDate);
      }
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: matchConditions,
      },
      {
        $match: {
          $expr: {
            $lt: ["$bookedSeats", "$maxSeats"],
          },
        },
      },
      {
        $sort: { date: 1, startTime: 1 },
      },
    ];

    // Add limit if provided
    if (limit) {
      pipeline.push({ $limit: limit });
    }

    // Execute aggregation
    const slots = await Slot.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    console.error("Get slots error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    Get available slots (for admin)
 * @route   GET /api/slots/admin/available
 * @access  Admin
 */
exports.getAvailableSlotsByAdmin = async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only",
      });
    }

    //  NEW: Validate query parameters
    const { error, value } = getAvailableSlotsQuerySchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { date, startDate, endDate, limit } = value;

    // Build match conditions
    const matchConditions = { isActive: true };

    // Add date filters if provided
    if (date) {
      matchConditions.date = new Date(date);
    }

    if (startDate || endDate) {
      matchConditions.date = {};
      if (startDate) {
        matchConditions.date.$gte = new Date(startDate);
      }
      if (endDate) {
        matchConditions.date.$lte = new Date(endDate);
      }
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: matchConditions,
      },
      {
        $match: {
          $expr: {
            $lt: ["$bookedSeats", "$maxSeats"],
          },
        },
      },
      {
        $sort: { date: 1, startTime: 1 },
      },
    ];

    // Add limit if provided
    if (limit) {
      pipeline.push({ $limit: limit });
    }

    // Execute aggregation
    const slots = await Slot.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    console.error("Get slots error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete slot by ID
 * @route   DELETE /api/slots/:id
 * @access  Admin
 */
exports.deleteSlotById = async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only",
      });
    }

    // NEW: Validate slot ID
    const { error, value } = slotIdSchema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { id } = value;

    const slot = await Slot.findByIdAndDelete(id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Slot deleted successfully",
      data: slot,
    });
  } catch (error) {
    console.error("Delete slot error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = exports;