const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const ApiError = require("./config/ApiError");

const app = express();

/* =============================
   LOAD ENV VARIABLES FIRST
============================= */

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

console.log("NODE_ENV:", process.env.NODE_ENV);

/* =============================
   DATABASE CONNECTION
============================= */

try {
  connectDB();
  // logger.info("Database connection initiated");
} catch (err) {
  logger.error("Failed to connect to the database", err);
  process.exit(1);
}

/* =============================
   CORS CONFIGURATION
============================= */

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman, curl

      const allowedOrigins = [
        "https://psa.atomtech.in",
        "http://localhost",
        "http://192.",
        "http://10.",
      ];

      if (
        allowedOrigins.some((allowedOrigin) =>
          origin.startsWith(allowedOrigin)
        )
      ) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new ApiError(403, "Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* =============================
   BODY PARSER
============================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =============================
   MORGAN LOGGER
============================= */

const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

if (process.env.NODE_ENV === "production") {
  const accessLogStream = fs.createWriteStream(
    path.join(logsDir, "access.log"),
    { flags: "a" }
  );
  app.use(morgan("combined", { stream: accessLogStream }));
} else {
  app.use(morgan("dev"));
}

/* =============================
   ROUTES
============================= */

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/slots", require("./routes/slotRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));

/* =============================
   HEALTH CHECK
============================= */

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    uptime: process.uptime(),
    message: "Service is healthy",
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
  });
});

/* =============================
   404 HANDLER
============================= */

app.use((req, res, next) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  next(new ApiError(404, "Route not found"));
});

/* =============================
   GLOBAL ERROR HANDLER
============================= */

app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
    });
  }

  // Invalid Mongo ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  // Custom ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Default server error
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

/* =============================
   SERVER START
============================= */

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  logger.info(
    `Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );
  console.log(`Server running on port ${PORT}`);
});