const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createBooking,
  myBookings,
  getAllBookings,
  cancelBooking,
} = require("../controllers/bookingController");
const bookingController = require("../controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { bookingSchemas } = require("../validations/schemas");

const { get } = require("mongoose");

// router.post("/", auth, createBooking); // Create a new booking
// router.get("/my-bookings", auth, myBookings); // Get bookings for logged-in user
// router.get("/admin/all-bookings", auth, getAllBookings); // Admin: Get all bookings
// router.delete("/cancel-booking/:bookingId", auth, cancelBooking); // Cancel a booking

// Create booking - requires auth + customer + validation
router.post(
  "/",
  authMiddleware,
  validate(bookingSchemas.create),
  bookingController.createBooking,
);

// Get my bookings - requires auth + customer
router.get("/my-bookings", authMiddleware, bookingController.myBookings);

// Get all bookings - requires auth + admin
router.get(
  "/admin/all-bookings",
  authMiddleware,
  bookingController.getAllBookings,
);

// Cancel booking - requires auth + validation on params
router.delete(
  "/cancel-booking/:bookingId",
  authMiddleware,
  validate(bookingSchemas.cancel, "params"),
  bookingController.cancelBooking,
);

module.exports = router;
