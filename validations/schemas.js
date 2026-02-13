const Joi = require("joi");

// ========================================
// AUTH VALIDATION SCHEMAS
// ========================================

const authSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).trim().required().messages({
      "string.empty": "Name is required",
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 50 characters",
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

    password: Joi.string()
      .min(6)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 6 characters long",
        "string.max": "Password cannot exceed 128 characters",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        "any.required": "Password is required",
      }),

    role: Joi.string().valid("patient", "admin").default("patient").messages({
      "any.only": "Role must be either 'patient' or 'admin'",
    }),
  }),

  login: Joi.object({
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

    password: Joi.string().required().messages({
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
  }),
};

// ========================================
// SLOT VALIDATION SCHEMAS
// ========================================

const slotSchemas = {
  create: Joi.object({
    date: Joi.date().iso().min("now").required().messages({
      "date.base": "Please provide a valid date",
      "date.min": "Date cannot be in the past",
      "any.required": "Date is required",
    }),

    startTime: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM|am|pm))?$/)
      .required()
      .messages({
        "string.pattern.base":
          "Please provide start time in valid format (e.g., 10:00 or 10:00 AM)",
        "any.required": "Start time is required",
      }),

    endTime: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM|am|pm))?$/)
      .required()
      .messages({
        "string.pattern.base":
          "Please provide end time in valid format (e.g., 11:00 or 11:00 AM)",
        "any.required": "End time is required",
      }),

    maxSeats: Joi.number().integer().min(1).max(1000).required().messages({
      "number.base": "Max seats must be a number",
      "number.min": "Max seats must be at least 1",
      "number.max": "Max seats cannot exceed 1000",
      "any.required": "Max seats is required",
    }),

    bookedSeats: Joi.number().integer().min(0).default(0).messages({
      "number.base": "Booked seats must be a number",
      "number.min": "Booked seats cannot be negative",
    }),

    isActive: Joi.boolean().default(true),
  }),

  update: Joi.object({
    date: Joi.date().iso().min("now").messages({
      "date.base": "Please provide a valid date",
      "date.min": "Date cannot be in the past",
    }),

    startTime: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM|am|pm))?$/)
      .messages({
        "string.pattern.base":
          "Please provide start time in valid format (e.g., 10:00 or 10:00 AM)",
      }),

    endTime: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM|am|pm))?$/)
      .messages({
        "string.pattern.base":
          "Please provide end time in valid format (e.g., 11:00 or 11:00 AM)",
      }),

    maxSeats: Joi.number().integer().min(1).max(1000).messages({
      "number.base": "Max seats must be a number",
      "number.min": "Max seats must be at least 1",
      "number.max": "Max seats cannot exceed 1000",
    }),

    isActive: Joi.boolean(),
  }).min(1), // At least one field must be present
};

// ========================================
// BOOKING VALIDATION SCHEMAS
// ========================================

const bookingSchemas = {
  create: Joi.object({
    slotId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid slot ID format",
        "any.required": "Slot ID is required",
      }),
  }),

  cancel: Joi.object({
    bookingId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid booking ID format",
        "any.required": "Booking ID is required",
      }),
  }),
};

// ========================================
// COMMON VALIDATION SCHEMAS
// ========================================

const commonSchemas = {
  mongoId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid ID format",
      "any.required": "ID is required",
    }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      "number.base": "Page must be a number",
      "number.min": "Page must be at least 1",
    }),

    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100",
    }),
  }),
};

module.exports = {
  authSchemas,
  slotSchemas,
  bookingSchemas,
  commonSchemas,
};
