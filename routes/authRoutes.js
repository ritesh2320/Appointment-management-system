const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const { authSchemas } = require("../validations/schemas");
const validate = require("../middleware/validate");
const authController = require("../controllers/authController");

router.post(
  "/register",
  validate(authSchemas.register),
  authController.register,
);

router.post("/login", validate(authSchemas.login), authController.login);

module.exports = router;
