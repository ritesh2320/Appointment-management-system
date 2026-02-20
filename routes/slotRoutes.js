const express = require("express");
const router = express.Router();
const {
  authenticate,
  authorizeAdmin,
  authorizeRoles,
} = require("../middleware/authMiddleware");
const {
  createSlot,
  getAvailableSlots,
  deleteSlotById,
} = require("../controllers/slotController");

// Create slot - requires auth + admin + validation
router.post(
  "/",
  authenticate,
  authorizeAdmin,
  createSlot,
);

// get available slots - requires auth + admin
router.get(
  "/available",
  authenticate,
  authorizeRoles("admin", "patient"),
  getAvailableSlots
);

// Delete slot by id - requires auth + admin
router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  deleteSlotById,
);

module.exports = router;