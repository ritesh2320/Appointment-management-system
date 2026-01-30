const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

console.log("NODE_ENV:", process.env.NODE_ENV);

try {
  connectDB();
} catch (err) {
  console.error("Failed to connect to the database", err);
  process.exit(1);
}

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/slots", require("./routes/slotRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    message: "Server is running",
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
