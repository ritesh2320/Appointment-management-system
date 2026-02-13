const Booking = require("../models/booking");
const Slot = require("../models/slot");
const User = require("../models/user");
const Patient = require("../models/patient");
const Joi = require("joi");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

// Validation schemas
const createBookingSchema = Joi.object({
  slotId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid slot ID format",
      "any.required": "Slot ID is required",
    }),
  patientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid patient ID format",
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

// exports.createBooking = async (req, res) => {
//   try {
//     // Check user role
//     if (req.user.role !== "patient") {
//       return res.status(403).json({ message: "users only" });
//     }

//     // Validate request body
//     const { error, value } = createBookingSchema.validate(req.body, {
//       abortEarly: false,
//       stripUnknown: true,
//     });

//     if (error) {
//       const errors = error.details.map((detail) => detail.message);
//       return res.status(400).json({
//         message: "Validation failed",
//         errors: errors,
//       });
//     }

//     const { slotId } = value;

//     // Find slot
//     const slot = await Slot.findById(slotId);

//     if (!slot || !slot.isActive) {
//       return res.status(400).json({ message: "Slot unavailable" });
//     }

//     if (slot.bookedSeats >= slot.maxSeats) {
//       return res.status(400).json({ message: "Slot full" });
//     }

//     // Check for duplicate booking (same user, same slot)
//     const existingBooking = await Booking.findOne({
//       userId: req.user.id,
//       slotId: slotId,
//       status: { $ne: "cancelled" }, // Not cancelled
//     });

//     if (existingBooking) {
//       return res.status(400).json({
//         message: "You have already booked this slot",
//       });
//     }

//     // atomic update to increment booked seats
//     // verify slot is not full before incrementing
//     const updatedSlot = await Slot.findOneAndUpdate(
//       { _id: slotId, bookedSeats: { $lt: slot.maxSeats } },
//       { $inc: { bookedSeats: 1 } },
//       { new: true }
//     );

//     if (!updatedSlot) {
//       return res.status(400).json({ message: "Slot full or unavailable" });
//     }

//     // Create booking
//     let booking;
//     try {
//       booking = await Booking.create({
//         userId: req.user.id,
//         slotId,
//         bookingDate: slot.date,
//       });
//     } catch (createError) {
//       // Rollback seat count if booking fails
//       await Slot.findByIdAndUpdate(slotId, { $inc: { bookedSeats: -1 } });
//       throw createError;
//     }

//     // Populate slot details before sending response
//     await booking.populate("slotId");

//     res.status(201).json(booking);
//   } catch (err) {
//     logger.error("Create booking error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

exports.createBooking = async (req, res) => {
  try {
    const { error, value } = createBookingSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map(d => d.message),
      });
    }

    const { slotId, patientId } = value;

    const slot = await Slot.findById(slotId);

    if (!slot || !slot.isActive) {
      return res.status(400).json({ message: "Slot unavailable" });
    }

    if (slot.bookedSeats >= slot.maxSeats) {
      return res.status(400).json({ message: "Slot full" });
    }

    // 🔥 Core Logic
    let finalPatientId;

    if (req.user.role === "patient") {
      finalPatientId = req.user.id; // 👈 SET USER ID AS PATIENT ID
    } else if (req.user.role === "admin") {
      if (!patientId) {
        return res.status(400).json({
          message: "Patient ID required for admin booking",
        });
      }
      finalPatientId = patientId;
    }

    // Duplicate check
    const existingBooking = await Booking.findOne({
      patientId: finalPatientId,
      slotId,
      status: { $ne: "cancelled" },
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "This patient already booked this slot",
      });
    }

    // Atomic seat increment
    const updatedSlot = await Slot.findOneAndUpdate(
      { _id: slotId, bookedSeats: { $lt: slot.maxSeats } },
      { $inc: { bookedSeats: 1 } },
      { new: true }
    );

    if (!updatedSlot) {
      return res.status(400).json({ message: "Slot full" });
    }

    const booking = await Booking.create({
      userId: req.user.id,
      patientId: finalPatientId,
      slotId,
      bookingDate: slot.date,
    });

    await booking.populate(["slotId", "patientId"]);

    res.status(201).json(booking);

  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.createAdminBooking = async (req, res) => {
  try {
    const { slotId, patientId } = req.body;
    
    // Admin check
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    // Validate that patientId is provided
    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
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

    // Find slot
    const slot = await Slot.findById(slotId);

    if (!slot || !slot.isActive) {
      return res.status(400).json({ message: "Slot unavailable" });
    }

    if (slot.bookedSeats >= slot.maxSeats) {
      return res.status(400).json({ message: "Slot full" });
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check if patient already booked this slot
    const existingBooking = await Booking.findOne({
      patientId: patientId,
      slotId: slotId
    });

    if (existingBooking) {
      return res.status(400).json({ message: "Patient already booked this slot" });
    }

    // Increment booked seats atomically
    // Check if slot is full using atomic query
    const updatedSlot = await Slot.findOneAndUpdate(
      { _id: slotId, bookedSeats: { $lt: slot.maxSeats } },
      { $inc: { bookedSeats: 1 } },
      { new: true }
    );

    if (!updatedSlot) {
      return res.status(400).json({ message: "Slot full or unavailable" });
    }

    // Create booking - USE patientId
    let booking;
    try {
      booking = await Booking.create({
        userId: req.user.id,  // Admin ID
        patientId: patientId, // Patient ID
        slotId,
        bookingDate: slot.date,
      });
    } catch (createError) {
      // Rollback seat count if booking fails
      await Slot.findByIdAndUpdate(slotId, { $inc: { bookedSeats: -1 } });
      throw createError;
    }

    // Populate slot details before sending response
    await booking.populate("slotId");

    res.status(201).json(booking);
  } catch (err) {
    logger.error("Create admin booking error:", {
      message: err.message,
      stack: err.stack,
      body: req.body
    });
    res.status(500).json({ 
      message: "Server error",
      details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};


exports.myBookings = async (req, res) => {
  try {
    // user check
    if (req.user.role !== "patient") {
      return res.status(403).json({ message: "users only" });
    }

    const bookings = await Booking.find({ userId: req.user.id })
      .populate("slotId")
      .sort({ createdAt: -1 }); // Newest first

    res.json(bookings);
  } catch (error) {
    logger.error("Get my bookings error:", error);
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
    logger.error("Get all bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get all bookings for a specific slot
 * GET /api/bookings/slot/:slotId
 * @access Private/Admin
 */



/**
 * Get all bookings for a specific slot with proper patient data
 * GET /api/bookings/slot/:slotId
 * @access Private/Admin
 */
exports.getBookingsBySlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    // Validate slot ID
    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid slot ID format",
      });
    }

    // Check if slot exists
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
      });
    }

    // Fetch bookings with basic population
    const bookings = await Booking.find({ 
      slotId: slotId,
      status: { $ne: "cancelled" }
    })
      .populate({
        path: "userId",
        select: "name email phone role",
      })
      .populate({
        path: "slotId",
        select: "date startTime endTime maxSeats bookedSeats price",
      })
      .sort({ createdAt: -1 });

    // Manually fetch and attach patient details
    const bookingsWithPatientData = await Promise.all(
      bookings.map(async (booking) => {
        const bookingObj = booking.toObject();
        
        // Try to find patient by patientId first (for admin-created patients)
        let patientData = await Patient.findById(booking.patientId).lean();
        
        // If no patient found, it might be a patient (userId === patientId)
        if (!patientData) {
          patientData = await User.findById(booking.patientId)
            .select("name email phone")
            .lean();
        }

        // Attach patient data
        bookingObj.patient = patientData || {
          _id: booking.patientId,
          name: "Unknown",
          email: "N/A",
          phone: "N/A",
        };

        return bookingObj;
      })
    );

    return res.status(200).json({
      success: true,
      slot: {
        _id: slot._id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxSeats: slot.maxSeats,
        bookedSeats: slot.bookedSeats,
      },
      totalBookings: bookingsWithPatientData.length,
      bookings: bookingsWithPatientData,
    });

  } catch (error) {
    console.error("Fetch slot bookings error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getBookingsBySlotAggregation = async (req, res) => {
  try {
    const { slotId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid slot ID format",
      });
    }

    const slotObjectId = new mongoose.Types.ObjectId(slotId);

    // Check if slot exists
    const slot = await Slot.findById(slotObjectId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
      });
    }

    // Use aggregation to get bookings with patient data
    const bookings = await Booking.aggregate([
      // Match bookings for this slot
      {
        $match: {
          slotId: slotObjectId,
          status: { $ne: "cancelled" },
        },
      },

      // Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup patient from Patient collection
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patientFromPatients",
        },
      },

      // Lookup patient from User collection (for patients)
      {
        $lookup: {
          from: "users",
          localField: "patientId",
          foreignField: "_id",
          as: "patientFromUsers",
        },
      },

      // Lookup slot details
      {
        $lookup: {
          from: "slots",
          localField: "slotId",
          foreignField: "_id",
          as: "slotDetails",
        },
      },
      {
        $unwind: {
          path: "$slotDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Project the final structure
      {
        $project: {
          _id: 1,
          userId: {
            _id: "$userDetails._id",
            name: "$userDetails.name",
            email: "$userDetails.email",
            role: "$userDetails.role",
          },
          slotId: {
            _id: "$slotDetails._id",
            date: "$slotDetails.date",
            startTime: "$slotDetails.startTime",
            endTime: "$slotDetails.endTime",
            maxSeats: "$slotDetails.maxSeats",
            bookedSeats: "$slotDetails.bookedSeats",
          },
          // Use patient from Patients collection if exists, otherwise from Users
          patient: {
            $cond: {
              if: { $gt: [{ $size: "$patientFromPatients" }, 0] },
              then: {
                $let: {
                  vars: { p: { $arrayElemAt: ["$patientFromPatients", 0] } },
                  in: {
                    _id: "$$p._id",
                    name: "$$p.name",
                    email: "$$p.email",
                    phone: "$$p.phone",
                    age: "$$p.age",
                    gender: "$$p.gender",
                    bloodGroup: "$$p.bloodGroup",
                    source: "Patient",
                  },
                },
              },
              else: {
                $cond: {
                  if: { $gt: [{ $size: "$patientFromUsers" }, 0] },
                  then: {
                    $let: {
                      vars: { u: { $arrayElemAt: ["$patientFromUsers", 0] } },
                      in: {
                        _id: "$$u._id",
                        name: "$$u.name",
                        email: "$$u.email",
                        phone: "$$u.phone",
                        source: "User",
                      },
                    },
                  },
                  else: null,
                },
              },
            },
          },
          bookingDate: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },

      // Sort by creation date
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      slot: {
        _id: slot._id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxSeats: slot.maxSeats,
        bookedSeats: slot.bookedSeats,
      },
      totalBookings: bookings.length,
      bookings,
    });

  } catch (error) {
    console.error("Fetch slot bookings aggregation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
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
   await Slot.findOneAndUpdate(
    { _id: booking.slotId, bookedSeats: { $gt: 0 } },
    { $inc: { bookedSeats: -1 } }
  );


    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    logger.error("Cancel booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get booking statistics (admin only)
 * GET /api/bookings/stats
 * @access Private/Admin
 */
exports.getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });

    // Bookings by date (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentBookings = await Booking.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: pendingBookings,
        cancelled: cancelledBookings,
        completed: completedBookings,
        lastSevenDays: recentBookings
      }
    });

  } catch (error) {
    console.error('Error fetching booking statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking statistics',
      error: error.message
    });
  }
};

/**
 * Cancel all future bookings for a patient
 * DELETE /api/bookings/patient/:patientId/cancel-all
 * @access Private/Admin
 */
exports.cancelAllPatientBookings = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Validate patient ID
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID format",
      });
    }

    const patientObjectId = new mongoose.Types.ObjectId(patientId);
    const currentDate = new Date();

    console.log(`Canceling all future bookings for patient: ${patientId}`);

    // Find all active future bookings for this patient
    const futureBookings = await Booking.find({
      patientId: patientObjectId,
      status: { $in: ["confirmed", "pending"] }, // Only cancel active bookings
      bookingDate: { $gte: currentDate }, // Only future bookings
    }).populate("slotId");

    console.log(`Found ${futureBookings.length} future bookings to cancel`);

    if (futureBookings.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No future bookings found for this patient",
        cancelledCount: 0,
      });
    }

    // Cancel each booking and restore slot seats
    const cancelledBookings = [];
    const slotUpdates = [];

    for (const booking of futureBookings) {
      // Update booking status
      booking.status = "cancelled";
      booking.cancelledAt = new Date();
      await booking.save();
      cancelledBookings.push(booking._id);

      // Restore seat in slot (if slot exists)
      if (booking.slotId && booking.slotId._id) {
        slotUpdates.push(booking.slotId._id);
      }
    }

    // Bulk update slots to restore seats
    if (slotUpdates.length > 0) {
      await Slot.updateMany(
        { 
          _id: { $in: slotUpdates },
          bookedSeats: { $gt: 0 } 
        },
        { $inc: { bookedSeats: -1 } }
      );
      console.log(`Restored seats for ${slotUpdates.length} slots`);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully cancelled ${cancelledBookings.length} future booking(s)`,
      cancelledCount: cancelledBookings.length,
      cancelledBookingIds: cancelledBookings,
    });

  } catch (error) {
    console.error("Error canceling patient bookings:", error);
    return res.status(500).json({
      success: false,
      message: "Error canceling patient bookings",
      error: error.message,
    });
  }
};

/**
 * Get all bookings for a specific patient
 * GET /api/bookings/patient/:patientId
 * @access Private/Admin
 */
exports.getPatientBookings = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID format",
      });
    }

    const bookings = await Booking.find({ 
      patientId: new mongoose.Types.ObjectId(patientId) 
    })
      .populate("slotId", "date startTime endTime")
      .sort({ bookingDate: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });

  } catch (error) {
    console.error("Error fetching patient bookings:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching patient bookings",
      error: error.message,
    });
  }
};

module.exports = exports;