const express = require("express");
const router = express.Router();
const {
  authenticate,
  authorizeAdmin,
  authorizeRoles,
  authorizeUser,
} = require("../middleware/authMiddleware");
const {
  createSlot,
  getAvailableSlots,
} = require("../controllers/slotController");
const slotController = require("../controllers/slotController");
const validate = require("../middleware/validate");
const { slotSchemas } = require("../validations/schemas");

// Create slot - requires auth + admin + validation
router.post(
  "/",
  authenticate,
  authorizeAdmin,
  validate(slotSchemas.create),
  slotController.createSlot,
);

// get available slots - requires auth + admin
router.get(
  "/available",
  authenticate,
  authorizeRoles("admin", "patient"),
  slotController.getAvailableSlots
);

// Delete slot by id - requires auth + admin
router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  slotController.deleteSlotById,
);

module.exports = router;