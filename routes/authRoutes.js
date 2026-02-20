const express = require("express");
const router = express.Router();
const { register, login, getAuthDetails } = require("../controllers/authController");
const { authenticate, authorizeUser } = require("../middleware/authMiddleware");

router.post(
  "/register",
  register,
);

router.post("/login", login);

router.get("/auth-details/:userId", authenticate,authorizeUser, getAuthDetails);



module.exports = router;
