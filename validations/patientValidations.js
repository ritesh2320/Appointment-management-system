const Joi = require("joi");

/**
 * Validation schema for creating a new patient
 */
const createPatientSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Patient name is required",
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 100 characters",
      "any.required": "Patient name is required",
    }),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Please provide a valid phone number",
      "any.required": "Phone number is required",
    }),

  age: Joi.number()
    .integer()
    .min(1)
    .max(150)
    .required()
    .messages({
      "number.base": "Age must be a number",
      "number.min": "Age must be at least 1",
      "number.max": "Age cannot exceed 150",
      "any.required": "Age is required",
    }),

  gender: Joi.string()
    .valid("Male", "Female", "Other")
    .required()
    .messages({
      "string.empty": "Gender is required",
      "any.only": "Gender must be Male, Female, or Other",
      "any.required": "Gender is required",
    }),

  address: Joi.object({
    street: Joi.string().trim().allow("").optional(),
    city: Joi.string().trim().allow("").optional(),
    state: Joi.string().trim().allow("").optional(),
    zipCode: Joi.string().trim().allow("").optional(),
    country: Joi.string().trim().default("India").optional(),
  }).optional(),

  medicalHistory: Joi.array()
    .items(
      Joi.object({
        condition: Joi.string().trim().required(),
        diagnosedDate: Joi.date().optional(),
        notes: Joi.string().trim().allow("").optional(),
      })
    )
    .optional(),

  allergies: Joi.array()
    .items(Joi.string().trim())
    .optional(),

  bloodGroup: Joi.string()
    .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
    .optional()
    .messages({
      "any.only": "Invalid blood group",
    }),

  emergencyContact: Joi.object({
    name: Joi.string().trim().optional(),
    relationship: Joi.string().trim().optional(),
    phone: Joi.string()
      .trim()
      .pattern(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
      .optional()
      .messages({
        "string.pattern.base": "Please provide a valid emergency contact phone number",
      }),
  }).optional(),
});

/**
 * Validation schema for updating a patient
 * All fields are optional for partial updates
 */
const updatePatientSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 100 characters",
    }),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .optional()
    .messages({
      "string.email": "Please provide a valid email address",
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
    .optional()
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
    }),

  age: Joi.number()
    .integer()
    .min(1)
    .max(150)
    .optional()
    .messages({
      "number.min": "Age must be at least 1",
      "number.max": "Age cannot exceed 150",
    }),

  gender: Joi.string()
    .valid("Male", "Female", "Other")
    .optional()
    .messages({
      "any.only": "Gender must be Male, Female, or Other",
    }),

  address: Joi.object({
    street: Joi.string().trim().allow("").optional(),
    city: Joi.string().trim().allow("").optional(),
    state: Joi.string().trim().allow("").optional(),
    zipCode: Joi.string().trim().allow("").optional(),
    country: Joi.string().trim().optional(),
  }).optional(),

  medicalHistory: Joi.array()
    .items(
      Joi.object({
        condition: Joi.string().trim().required(),
        diagnosedDate: Joi.date().optional(),
        notes: Joi.string().trim().allow("").optional(),
      })
    )
    .optional(),

  allergies: Joi.array()
    .items(Joi.string().trim())
    .optional(),

  bloodGroup: Joi.string()
    .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
    .optional()
    .messages({
      "any.only": "Invalid blood group",
    }),

  emergencyContact: Joi.object({
    name: Joi.string().trim().optional(),
    relationship: Joi.string().trim().optional(),
    phone: Joi.string()
      .trim()
      .pattern(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
      .optional()
      .messages({
        "string.pattern.base": "Please provide a valid emergency contact phone number",
      }),
  }).optional(),

  isActive: Joi.boolean().optional(),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});

/**
 * Validation schema for patient ID parameter
 */
const patientIdSchema = Joi.object({
  patientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid patient ID format",
      "any.required": "Patient ID is required",
    }),
});

/**
 * Validation schema for query parameters
 */
const queryPatientSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  sortBy: Joi.string()
    .valid("name", "email", "age", "createdAt", "lastVisit")
    .default("createdAt")
    .optional(),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .default("desc")
    .optional(),
  search: Joi.string().trim().allow("").optional(),
  gender: Joi.string().valid("Male", "Female", "Other").optional(),
  isActive: Joi.boolean().optional(),
  minAge: Joi.number().integer().min(1).max(150).optional(),
  maxAge: Joi.number().integer().min(1).max(150).optional(),
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

module.exports = {
  createPatientSchema,
  updatePatientSchema,
  patientIdSchema,
  queryPatientSchema,
  getAllPatientsQuerySchema,
};