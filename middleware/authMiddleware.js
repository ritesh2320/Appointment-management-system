const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt");

/**
 * 🔐 Authenticate JWT Token
 */
const authenticate = (req, res, next) => {
  let token;

  // 1️⃣ Check Authorization header
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2️⃣ Optional: Check cookie (if using cookies)
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach clean user object
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * 🔐 Authorize Roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * 👤 Role Shortcuts
 */
const authorizeAdmin = authorizeRoles("admin");
const authorizeUser = authorizeRoles("patient");
const authorizeSuperAdmin = authorizeRoles("superadmin");

module.exports = {
  authenticate,
  authorizeAdmin,
  authorizeSuperAdmin,
  authorizeRoles,
  authorizeUser,
};
