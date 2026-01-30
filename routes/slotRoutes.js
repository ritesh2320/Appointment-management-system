const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createSlot,
  getAvailableSlots,
} = require("../controllers/slotController");
const slotController = require("../controllers/slotController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { slotSchemas } = require("../validations/schemas");

// Create slot - requires auth + admin + validation
router.post(
  "/",
  authMiddleware,
  validate(slotSchemas.create),
  slotController.createSlot,
);

// Get available slots - requires auth only
router.get("/available", authMiddleware, slotController.getAvailableSlots);

module.exports = router;
