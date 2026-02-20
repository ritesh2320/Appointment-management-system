const Joi = require("joi");

const doctorSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required().messages({
    "string.empty": "Doctor name is required",
    "any.required": "Doctor name is required",
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
    .pattern(/^[\+]?[0-9]{7,15}$/)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Please enter a valid phone number",
      "any.required": "Phone number is required",
    }),

  gender: Joi.string().valid("Male", "Female", "Other").required().messages({
    "any.only": "Gender must be Male, Female, or Other",
    "any.required": "Gender is required",
  }),

  specialization: Joi.string().trim().required().messages({
    "string.empty": "Specialization is required",
    "any.required": "Specialization is required",
  }),

  education: Joi.array()
    .items(
      Joi.object({
        degree: Joi.string().trim().required().messages({
          "string.empty": "Degree is required",
          "any.required": "Degree is required",
        }),
        institution: Joi.string().trim().required().messages({
          "string.empty": "Institution is required",
          "any.required": "Institution is required",
        }),
        university: Joi.string().trim().optional(),
        yearOfCompletion: Joi.number()
          .integer()
          .min(1950)
          .max(new Date().getFullYear())
          .optional()
          .messages({
            "number.min": "Year seems too old",
            "number.max": "Year cannot be in the future",
          }),
      })
    )
    .optional(),

  certifications: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().trim().required().messages({
          "string.empty": "Certification title is required",
          "any.required": "Certification title is required",
        }),
        issuingOrganization: Joi.string().trim().optional(),
        issueDate: Joi.date().optional(),
        expiryDate: Joi.date().optional(),
        certificateNumber: Joi.string().trim().optional(),
      })
    )
    .optional(),

  experience: Joi.array()
    .items(
      Joi.object({
        hospitalName: Joi.string().trim().required().messages({
          "string.empty": "Hospital name is required",
          "any.required": "Hospital name is required",
        }),
        position: Joi.string().trim().optional(),
        from: Joi.date().required().messages({
          "any.required": "Start date is required",
        }),
        to: Joi.date().optional().allow(null),
        isCurrent: Joi.boolean().default(false),
      })
    )
    .optional(),
});

const updateDoctorSchema = doctorSchema.fork(
  ["name", "email", "phone", "gender", "specialization"],
  (field) => field.optional()
);

module.exports = {
  doctorSchema,
  updateDoctorSchema,
};
