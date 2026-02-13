const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    }, 
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: function () {
        return !this.userId; // required only for admin-created patients
      },
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    phone: {
      type: String,
      required: function () {
        return !this.userId;
      },
      trim: true,
      match: [
        /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
        "Please enter a valid phone number",
      ],
    },
    age: {
      type: Number,
      required: function () {
        return !this.userId;
      },
      min: [1, "Age must be at least 1"],
      max: [150, "Age cannot exceed 150"],
    },
    gender: {
      type: String,
      required: function () {
        return !this.userId;
      },
      enum: {
        values: ["Male", "Female", "Other"],
        message: "Gender must be Male, Female, or Other",
      },
    },
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      zipCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
        default: "India",
      },
    },
    medicalHistory: [
      {
        condition: {
          type: String,
          trim: true,
        },
        diagnosedDate: {
          type: Date,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
    allergies: [
      {
        type: String,
        trim: true,
      },
    ],
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true,
      },
      relationship: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    registeredDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastVisit: {
      type: Date,
    },
    totalVisits: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
// Note: email already has unique index from schema definition
patientSchema.index({ phone: 1 });
patientSchema.index({ name: 1 });
patientSchema.index({ isActive: 1 });
patientSchema.index({ createdAt: -1 });

// Virtual for full address
patientSchema.virtual("fullAddress").get(function () {
  if (!this.address) return "";
  const { street, city, state, zipCode, country } = this.address;
  return [street, city, state, zipCode, country].filter(Boolean).join(", ");
});

// Virtual for age category
patientSchema.virtual("ageCategory").get(function () {
  if (this.age < 13) return "Child";
  if (this.age < 20) return "Teenager";
  if (this.age < 60) return "Adult";
  return "Senior";
});

// Pre-save middleware to update totalVisits
// IMPORTANT: Must be async or use callback pattern correctly
patientSchema.pre("save", async function () {
  // Only increment totalVisits if this is an update (not a new document)
  // and lastVisit was modified
  if (!this.isNew && this.isModified("lastVisit")) {
    this.totalVisits = (this.totalVisits || 0) + 1;
  }
  // No need to call next() with async functions
});

// Static method to find active patients
patientSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Instance method to deactivate patient
patientSchema.methods.deactivate = function () {
  this.isActive = false;
  return this.save();
};

// Instance method to update last visit
// Use this method when recording a patient visit
patientSchema.methods.recordVisit = function () {
  this.lastVisit = new Date();
  this.totalVisits += 1;
  return this.save();
};

// Prevent model recompilation in development (hot reload)
module.exports = mongoose.models.Patient || mongoose.model("Patient", patientSchema);