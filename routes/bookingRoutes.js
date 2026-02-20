const express = require("express");
const router = express.Router();
const {
  authenticate,
  authorizeAdmin,
} = require("../middleware/authMiddleware");
const {
  createBooking,
  createAdminBooking,
  myBookings,
  getAllBookings,
  cancelBooking,
  getBookingsBySlot,
  getBookingStats,
  getBookingsBySlotAggregation,
  getPatientBookings,
  cancelAllPatientBookings
} = require("../controllers/bookingController");


// Create booking - requires auth + patient + validation
router.post(
  "/",
  authenticate,
  createBooking,
);

// Create admin booking - requires auth + admin
router.post('/admin/bookings', authenticate, authorizeAdmin, createAdminBooking);

// Get my bookings - requires auth + patient
router.get("/my-bookings", authenticate, myBookings);

// Get all bookings - requires auth + admin
router.get(
  "/admin/all-bookings",
  authenticate,
  authorizeAdmin,
  getAllBookings,
);

// Cancel booking - requires auth + validation on params
router.delete(
  "/cancel-booking/:bookingId",
  authenticate,
  cancelBooking,
);

router.get("/slots/:slotId",authenticate,authorizeAdmin,getBookingsBySlot)

/**
 * @route   GET /api/bookings/stats
 * @desc    Get booking statistics
 * @access  Private/Admin
 */
router.get('/stats', authenticate, authorizeAdmin, getBookingStats);

router.get("/slot-agg/:slotId", authenticate, authorizeAdmin, getBookingsBySlotAggregation);

/**
 * @route   GET /api/bookings/patient/:patientId
 * @desc    Get all bookings for a specific patient
 * @access  Private/Admin
 */
router.get("/patient/:patientId", authenticate, authorizeAdmin, getPatientBookings);

/**
 * @route   DELETE /api/bookings/patient/:patientId/cancel-all
 * @desc    Cancel all future bookings for a patient 
 * @access  Private/Admin
 */
router.delete("/patient/:patientId/cancel-all", authenticate, authorizeAdmin, cancelAllPatientBookings);

module.exports = router;