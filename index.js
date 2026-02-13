console.log("NODE_ENV:", process.env.NODE_ENV);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const connectDB = require("./config/db");
const logger = require("./utils/logger");

const app = express();

// Load environment variables first
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser tools like Postman
      if (!origin || origin === "null") return callback(null, true);

      const allowedOrigins = [
        "https://psa.atomtech.in",
        "kopbankasso",
        "sznsbal",
        "uttirna",
        "localhost",
        "192",
        "10",
      ];

      if (
        allowedOrigins.some((allowedOrigin) => origin.includes(allowedOrigin))
      ) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// app.use(express.json());

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Morgan setup - HTTP request logger
if (process.env.NODE_ENV === "production") {
  // Production: log to file
  const accessLogStream = fs.createWriteStream(
    path.join(logsDir, "access.log"),
    { flags: "a" },
  );
  app.use(morgan("combined", { stream: accessLogStream }));
} else {
  // Development: log to console with color
  app.use(morgan("dev"));
}

// Custom Morgan token for response time logging
morgan.token("custom-date", () => {
  return new Date().toISOString();
});

// Database connection
try {
  connectDB();
  logger.info("Database connection initiated");
} catch (err) {
  logger.error("Failed to connect to the database", err);
  process.exit(1);
}

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/slots", require("./routes/slotRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
// app.use("/api/admin", require("./routes/adminRoutes"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    uptime: process.uptime(),
    message: "Service is healthy",
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`Server running on port ${PORT}`);
});
