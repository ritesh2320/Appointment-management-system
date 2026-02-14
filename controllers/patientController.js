const Patient = require("../models/patient");
const Joi = require("joi");

// ================== VALIDATION SCHEMAS ==================

const createPatientSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
    "any.required": "Name is required",
  }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

  phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "Phone must be between 10-15 digits",
    }),

  age: Joi.number().integer().min(0).max(150).optional().messages({
    "number.base": "Age must be a number",
    "number.min": "Age cannot be negative",
    "number.max": "Age must be a realistic value (max 150)",
    "number.integer": "Age must be a whole number",
  }),

  gender: Joi.string().valid("Male", "Female", "Other").optional().messages({
    "any.only": "Gender must be Male, Female, or Other",
  }),

  bloodGroup: Joi.string()
    .valid("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-")
    .optional()
    .messages({
      "any.only":
        "Invalid blood group. Must be one of: A+, A-, B+, B-, O+, O-, AB+, AB-",
    }),

  address: Joi.object({
    street: Joi.string().trim().optional().allow(""),
    city: Joi.string().trim().optional().allow(""),
    state: Joi.string().trim().optional().allow(""),
    zipCode: Joi.string().trim().optional().allow(""),
    country: Joi.string().trim().optional().allow(""),
  }).optional(),

  medicalHistory: Joi.array().items(Joi.string().trim()).optional().messages({
    "array.base": "Medical history must be an array of strings",
  }),

  allergies: Joi.array().items(Joi.string().trim()).optional().messages({
    "array.base": "Allergies must be an array of strings",
  }),

  emergencyContact: Joi.object({
    name: Joi.string().trim().required().messages({
      "string.empty": "Emergency contact name is required",
      "any.required": "Emergency contact name is required",
    }),
    phone: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Emergency contact phone must be between 10-15 digits",
        "any.required": "Emergency contact phone is required",
      }),
    relation: Joi.string().trim().required().messages({
      "string.empty": "Emergency contact relation is required",
      "any.required": "Emergency contact relation is required",
    }),
  }).optional(),
});

const updatePatientSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().optional().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
  }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .optional()
    .messages({
      "string.email": "Please provide a valid email address",
    }),

  phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "Phone must be between 10-15 digits",
    }),

  age: Joi.number().integer().min(0).max(150).optional().messages({
    "number.base": "Age must be a number",
    "number.min": "Age cannot be negative",
    "number.max": "Age must be a realistic value (max 150)",
    "number.integer": "Age must be a whole number",
  }),

  gender: Joi.string().valid("Male", "Female", "Other").optional().messages({
    "any.only": "Gender must be Male, Female, or Other",
  }),

  bloodGroup: Joi.string()
    .valid("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-")
    .optional()
    .messages({
      "any.only":
        "Invalid blood group. Must be one of: A+, A-, B+, B-, O+, O-, AB+, AB-",
    }),

  address: Joi.object({
    street: Joi.string().trim().optional().allow(""),
    city: Joi.string().trim().optional().allow(""),
    state: Joi.string().trim().optional().allow(""),
    zipCode: Joi.string().trim().optional().allow(""),
    country: Joi.string().trim().optional().allow(""),
  }).optional(),

  medicalHistory: Joi.array().items(Joi.string().trim()).optional().messages({
    "array.base": "Medical history must be an array of strings",
  }),

  allergies: Joi.array().items(Joi.string().trim()).optional().messages({
    "array.base": "Allergies must be an array of strings",
  }),

  emergencyContact: Joi.object({
    name: Joi.string().trim().required().messages({
      "string.empty": "Emergency contact name is required",
      "any.required": "Emergency contact name is required",
    }),
    phone: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Emergency contact phone must be between 10-15 digits",
        "any.required": "Emergency contact phone is required",
      }),
    relation: Joi.string().trim().required().messages({
      "string.empty": "Emergency contact relation is required",
      "any.required": "Emergency contact relation is required",
    }),
  }).optional(),

  isActive: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

const patientIdSchema = Joi.object({
  patientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid patient ID format",
      "any.required": "Patient ID is required",
    }),
});

const getAllPatientsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
    "number.integer": "Page must be a whole number",
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
    "number.integer": "Limit must be a whole number",
  }),

  search: Joi.string().trim().max(100).optional().allow("").messages({
    "string.max": "Search term cannot exceed 100 characters",
  }),

  gender: Joi.string().valid("Male", "Female", "Other").optional().messages({
    "any.only": "Gender must be Male, Female, or Other",
  }),

  bloodGroup: Joi.string()
    .valid("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-")
    .optional()
    .messages({
      "any.only": "Invalid blood group",
    }),

  isActive: Joi.string().valid("true", "false").optional().messages({
    "any.only": "isActive must be 'true' or 'false'",
  }),

  sortBy: Joi.string()
    .valid("name", "email", "createdAt", "age", "updatedAt")
    .default("createdAt")
    .messages({
      "any.only": "Invalid sort field",
    }),

  sortOrder: Joi.string().valid("asc", "desc").default("desc").messages({
    "any.only": "Sort order must be 'asc' or 'desc'",
  }),
});

// ================== CONTROLLER FUNCTIONS ==================

/**
 * @desc    Create new patient
 * @route   POST /api/patients
 * @access  Admin
 */
const createPatient = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = createPatientSchema.validate(req.body, {
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

    const {
      name,
      email,
      phone,
      age,
      gender,
      bloodGroup,
      address,
      medicalHistory,
      allergies,
      emergencyContact,
    } = value;

    // Check if patient with email already exists
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(409).json({
        success: false,
        message: "Patient with this email already exists",
      });
    }

    // Create new patient
    const patient = await Patient.create({
      name,
      email,
      phone,
      age,
      gender,
      bloodGroup,
      address,
      medicalHistory,
      allergies,
      emergencyContact,
      createdBy: req.user.id, // From auth middleware
    });

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Create patient error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create patient",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all patients with pagination and filters
 * @route   GET /api/patients
 * @access  Admin
 */
const getAllPatients = async (req, res, next) => {
  try {
    // Validate query parameters
    const { error, value } = getAllPatientsQuerySchema.validate(req.query, {
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

    const { page, limit, search, gender, bloodGroup, isActive, sortBy, sortOrder } =
      value;

    // Build query
    const query = {};

    // Search filter (name or email)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Gender filter
    if (gender) {
      query.gender = gender;
    }

    // Blood group filter
    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const [patients, total] = await Promise.all([
      Patient.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select("-__v"),
      Patient.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: patients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get all patients error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single patient by ID
 * @route   GET /api/patients/:patientId
 * @access  Admin
 */
const getPatientById = async (req, res, next) => {
  try {
    // Validate patient ID
    const { error, value } = patientIdSchema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { patientId } = value;

    const patient = await Patient.findById(patientId)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Get patient by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient",
      error: error.message,
    });
  }
};

/**
 * @desc    Update patient
 * @route   PUT /api/patients/:patientId
 * @access  Admin
 */
const updatePatient = async (req, res, next) => {
  try {
    // Validate patient ID
    const { error: idError, value: idValue } = patientIdSchema.validate(
      req.params,
      {
        abortEarly: false,
      }
    );

    if (idError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: idError.details.map((detail) => detail.message),
      });
    }

    // Validate request body
    const { error: bodyError, value: bodyValue } =
      updatePatientSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

    if (bodyError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: bodyError.details.map((detail) => detail.message),
      });
    }

    const { patientId } = idValue;
    const updateData = bodyValue;

    // Add updatedBy field
    updateData.updatedBy = req.user.id;

    const patient = await Patient.findByIdAndUpdate(patientId, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run schema validators
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Update patient error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update patient",
      error: error.message,
    });
  }
};

/**
 * @desc    Soft delete patient (set isActive to false)
 * @route   DELETE /api/patients/:patientId
 * @access  Admin
 */
const deletePatient = async (req, res, next) => {
  try {
    // Validate patient ID
    const { error, value } = patientIdSchema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { patientId } = value;

    const patient = await Patient.findByIdAndUpdate(
      patientId,
      {
        isActive: false,
        updatedBy: req.user.id,
      },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient deactivated successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Delete patient error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete patient",
      error: error.message,
    });
  }
};

/**
 * @desc    Restore deleted patient
 * @route   PATCH /api/patients/:patientId/restore
 * @access  Admin
 */
const restorePatient = async (req, res, next) => {
  try {
    // Validate patient ID
    const { error, value } = patientIdSchema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { patientId } = value;

    const patient = await Patient.findByIdAndUpdate(
      patientId,
      {
        isActive: true,
        updatedBy: req.user.id,
      },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient restored successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Restore patient error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore patient",
      error: error.message,
    });
  }
};

/**
 * @desc    Permanently delete patient
 * @route   DELETE /api/patients/:patientId/permanent
 * @access  Super Admin
 */
const permanentDeletePatient = async (req, res, next) => {
  try {
    // Validate patient ID
    const { error, value } = patientIdSchema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { patientId } = value;

    const patient = await Patient.findByIdAndDelete(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient permanently deleted",
      data: patient,
    });
  } catch (error) {
    console.error("Permanent delete patient error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to permanently delete patient",
      error: error.message,
    });
  }
};

/**
 * @desc    Get patient statistics
 * @route   GET /api/patients/stats
 * @access  Admin
 */
const getPatientStats = async (req, res, next) => {
  try {
    // Get current date and date 30 days ago
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log("Fetching patient stats...");
    console.log("Current date:", now);
    console.log("30 days ago:", thirtyDaysAgo);

    // Current stats
    const [total, active, inactive, maleCount, femaleCount, otherCount] =
      await Promise.all([
        Patient.countDocuments(),
        Patient.countDocuments({ isActive: true }),
        Patient.countDocuments({ isActive: false }),
        Patient.countDocuments({ gender: "Male", isActive: true }),
        Patient.countDocuments({ gender: "Female", isActive: true }),
        Patient.countDocuments({ gender: "Other", isActive: true }),
      ]);

    console.log("Current stats:", { total, active, inactive });

    // Previous period stats (30 days ago)
    const [totalPrevious, activePrevious, inactivePrevious] =
      await Promise.all([
        Patient.countDocuments({ createdAt: { $lt: thirtyDaysAgo } }),
        Patient.countDocuments({
          isActive: true,
          createdAt: { $lt: thirtyDaysAgo },
        }),
        Patient.countDocuments({
          isActive: false,
          createdAt: { $lt: thirtyDaysAgo },
        }),
      ]);

    console.log("Previous stats:", {
      totalPrevious,
      activePrevious,
      inactivePrevious,
    });

    // Calculate percentage changes
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return Math.round(((current - previous) / previous) * 100);
    };

    const totalChange = calculatePercentageChange(total, totalPrevious);
    const activeChange = calculatePercentageChange(active, activePrevious);
    const inactiveChange = calculatePercentageChange(
      inactive,
      inactivePrevious
    );

    console.log("Percentage changes:", {
      totalChange,
      activeChange,
      inactiveChange,
    });

    // Age categories
    const ageStats = await Patient.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ["$age", 13] }, then: "Child" },
                { case: { $lt: ["$age", 20] }, then: "Teenager" },
                { case: { $lt: ["$age", 60] }, then: "Adult" },
              ],
              default: "Senior",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const ageCategories = {
      Child: 0,
      Teenager: 0,
      Adult: 0,
      Senior: 0,
    };

    ageStats.forEach((stat) => {
      ageCategories[stat._id] = stat.count;
    });

    console.log("Age categories:", ageCategories);

    const responseData = {
      total,
      active,
      inactive,
      genderDistribution: {
        Male: maleCount,
        Female: femaleCount,
        Other: otherCount,
      },
      ageCategories,
      percentageChanges: {
        total: totalChange,
        active: activeChange,
        inactive: inactiveChange,
      },
    };

    console.log("Sending response:", responseData);

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Get patient stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient statistics",
      error: error.message,
    });
  }
};

module.exports = {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  restorePatient,
  permanentDeletePatient,
  getPatientStats,
};