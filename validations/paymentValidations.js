const Joi = require("joi");
const createPaymentIntentSchema = Joi.object({
  slotId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid slot ID format",
      "any.required": "Slot ID is required",
    }),
  paymentMethod: Joi.string().valid("razorpay").default("razorpay").messages({
    "any.only": "Payment method must be 'razorpay'",
  }),
});

const verifyPaymentSchema = Joi.object({
  paymentIntentId: Joi.string().required().messages({
    "any.required": "Payment intent ID is required",
  }),
  paymentMethod: Joi.string().valid("razorpay").required().messages({
    "any.required": "Payment method is required",
  }),
  // For Razorpay signature verification
  razorpay_order_id: Joi.string().required().messages({
    "any.required": "Razorpay order ID is required",
  }),
  razorpay_payment_id: Joi.string().required().messages({
    "any.required": "Razorpay payment ID is required",
  }),
  razorpay_signature: Joi.string().required().messages({
    "any.required": "Razorpay signature is required",
  }),
});

module.exports = {
  createPaymentIntentSchema,
  verifyPaymentSchema,
};