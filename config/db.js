const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB Connected");
    
    // Ensure the model is compiled before syncing
    require("../models/booking");
    
    // Sync indexes to ensure the unique constraint changes are applied
    const Booking = mongoose.model("Booking");
    await Booking.syncIndexes();
    logger.info("Booking indexes synchronized");
  } catch (error) {
    logger.error("Database connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
