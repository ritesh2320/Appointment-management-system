const User = require("../models/user");
const Patient = require("../models/patient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt");
const { registerSchema, loginSchema } = require("../validations/authValidations");
const ApiError = require("../config/ApiError");

//  Register

exports.register = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      // console.log("Validation errors:", JSON.stringify(error.details, null, 2));
      throw new ApiError(400,"Validation failed",error);
    }

    const { name, email, password, phone, age, gender, bloodGroup } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400,"User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with all profile fields
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      age,
      gender,
      bloodGroup,
      role: "patient",
    });

    // Auto-create linked patient profile
    await Patient.create({
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      age: user.age,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      createdBy: user._id,
    });

    throw new ApiError(201,"Registered successfully");

  } catch (err) {
    console.error("Register error:", err);
    throw new ApiError(500,"Server error",err);
  }
};


//  Login 

exports.login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new ApiError(400,"Validation failed",error);
    }

    const { email, password } = value;

    // Find user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError(400,"Invalid credentials");
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(400,"Invalid credentials");
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.json({
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    throw new ApiError(500,"Login failed",err);
  }
};

//  Logout

exports.logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
    });

    return res.json({ message: "Logged out successfully" });

  } catch (err) {
      throw new ApiError(500,"Logout failed",err);
  }
};


exports.getAuthDetails = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404,"User not found");
    }
    return res.json(user);
  } catch (err) {
    throw new ApiError(500,"Failed to get user details",err);
  }
};