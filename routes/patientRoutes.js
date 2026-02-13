const express = require("express");
const router = express.Router();
const {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  permanentDeletePatient,
  restorePatient,
  getPatientStats,
} = require("../controllers/patientController");
const {
  createPatientSchema,
  updatePatientSchema,
  patientIdSchema,
  queryPatientSchema,
} = require("../validations/patientValidation");
const validate = require("../middleware/validate");
const { authenticate, authorizeAdmin } = require("../middleware/authMiddleware");

/**
 * All routes require authentication and admin authorization
 * Apply middleware to all routes in this router
 */
router.use(authenticate);
router.use(authorizeAdmin);

/**
 * @route   GET /api/patients/stats
 * @desc    Get patient statistics
 * @access  Admin
 */
router.get(
  "/stats",
  getPatientStats
);

/**
 * @route   GET /api/patients
 * @desc    Get all patients with pagination and filters
 * @access  Admin
 */
router.get(
  "/",
  validate(queryPatientSchema, "query"),
  getAllPatients
);

/**
 * @route   POST /api/patients
 * @desc    Create new patient
 * @access  Admin
 */
router.post(
  "/",
  validate(createPatientSchema, "body"),
  createPatient
);

/**
 * @route   GET /api/patients/:patientId
 * @desc    Get single patient by ID
 * @access  Admin
 */
router.get(
  "/:patientId",
  validate(patientIdSchema, "params"),
  getPatientById
);

/**
 * @route   PUT /api/patients/:patientId
 * @desc    Update patient
 * @access  Admin
 */
router.put(
  "/:patientId",
  validate(patientIdSchema, "params"),
  validate(updatePatientSchema, "body"),
  updatePatient
);

/**
 * @route   DELETE /api/patients/:patientId
 * @desc    Soft delete patient (set isActive to false)
 * @access  Admin
 */
router.delete(
  "/:patientId",
  validate(patientIdSchema, "params"),
  deletePatient
);

/**
 * @route   DELETE /api/patients/:patientId/permanent
 * @desc    Permanently delete patient
 * @access  Super Admin
 */
router.delete(
  "/:patientId/permanent",
  validate(patientIdSchema, "params"),
  permanentDeletePatient
);

/**
 * @route   PATCH /api/patients/:patientId/restore
 * @desc    Restore deleted patient
 * @access  Admin
 */
router.patch(
  "/:patientId/restore",
  validate(patientIdSchema, "params"),
  restorePatient
);

module.exports = router;