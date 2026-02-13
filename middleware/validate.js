/**
 * Validation Middleware
 * Validates request data against Joi schemas
 */

const validate = (schema, source = "body") => {
  return (req, res, next) => {
    // Determine which part of the request to validate
    const dataToValidate = source === "params" 
      ? req.params 
      : source === "query" 
      ? req.query 
      : req.body;

    // Validate the data
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      // Format validation errors
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    // Replace the request data with validated (and possibly transformed) data
    if (source === "params") {
      req.params = value;
    } else if (source === "query") {
      req.query = value;
    } else {
      req.body = value;
    }

    // Call next middleware
    next();
  };
};

module.exports = validate;