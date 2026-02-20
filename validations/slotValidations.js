const Joi = require("joi");

// ================== VALIDATION SCHEMAS ==================

/**
 * Schema for creating a new slot
 */
const createSlotSchema = Joi.object({
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
});

/**
 * Schema for validating slot ID in URL parameters (NEW)
 */
const slotIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid slot ID format",
      "any.required": "Slot ID is required",
    }),
});

/**
 * Schema for query parameters in getAvailableSlots (NEW)
 */
const getAvailableSlotsQuerySchema = Joi.object({
  date: Joi.date().iso().optional().messages({
    "date.base": "Please provide a valid date",
  }),

  startDate: Joi.date().iso().optional().messages({
    "date.base": "Please provide a valid start date",
  }),

  endDate: Joi.date().iso().optional().messages({
    "date.base": "Please provide a valid end date",
  }),

  limit: Joi.number().integer().min(1).max(100).optional().messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),
});

module.exports = {
  createSlotSchema,
  slotIdSchema,
  getAvailableSlotsQuerySchema,
};
