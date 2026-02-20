// routes/doctorRoutes.js
const express = require("express");
const router = express.Router();
const {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorsBySpecialization,
} = require("../controllers/doctorController");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

// Public
router.get("/", getAllDoctors);
router.get("/:id", getDoctorById);
router.get("/specialization/:specialization", getDoctorsBySpecialization);

// Admin only
router.post("/", authenticate, authorizeAdmin, createDoctor);
router.put("/:id", authenticate, authorizeAdmin, updateDoctor);
router.delete("/:id", authenticate, authorizeAdmin, deleteDoctor);

module.exports = router;