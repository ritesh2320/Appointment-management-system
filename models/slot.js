const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    maxSeats: {
      type: Number,
      required: true,
      min: 1,
    },
    bookedSeats: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 1000, // Default price in smallest currency unit (cents/paise)
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["USD", "INR", "EUR", "GBP"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
  },
  {
    timestamps: true,
  },
);

// Compound index for unique slots
slotSchema.index({ date: 1, startTime: 1, endTime: 1 }, { unique: true });

// Index for querying available slots
slotSchema.index({ isActive: 1, date: 1 });

// Virtual field to calculate time per patient
slotSchema.virtual("timePerPatient").get(function () {
  if (!this.startTime || !this.endTime || !this.maxSeats) return null;

  const parseTime = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const totalMins = parseTime(this.endTime) - parseTime(this.startTime);
  return Math.floor(totalMins / this.maxSeats); // mins per patient
});

// module.exports = mongoose.model("Slot", slotSchema);
module.exports = mongoose.models.Slot || mongoose.model("Slot", slotSchema);
