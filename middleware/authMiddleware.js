const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt"); // Import secret

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || req?.headers?.cookie;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // Use JWT_SECRET
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// const User = require("../models/User");

// module.exports = async (req, res, next) => {
//   const token = req.headers.authorization || req?.headers?.cookie;
//   console.log(token, "token===========");

//   if (!token) {
//     return res.status(401).json({ message: "No token provided" });
//   }

//   //   const user = await User.findOne({ token });
//   //   if (!user) {
//   //     return res.status(401).json({ message: "Invalid token" });
//   //   }

//   const user = (req.user = user);
//   next();
// };
