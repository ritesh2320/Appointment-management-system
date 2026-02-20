const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    // ── Basic Info
    doctorId: {
      type: String,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[\+]?[0-9]{7,15}$/, "Please enter a valid phone number"],
    },

    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: {
        values: ["Male", "Female", "Other"],
        message: "Gender must be Male, Female, or Other",
      },
    },

    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
    },

    // Education 
    education: [
      {
        degree: {
          type: String,
          required: [true, "Degree is required"],
          trim: true,
          // e.g. MBBS, MD, MS, BDS
        },
        institution: {
          type: String,
          required: [true, "Institution name is required"],
          trim: true,
        },
        university: {
          type: String,
          trim: true,
        },
        yearOfCompletion: {
          type: Number,
          min: [1950, "Year seems too old"],
          max: [new Date().getFullYear(), "Year cannot be in the future"],
        },
      },
    ],

    // ── Certification
    certifications: [
      {
        title: {
          type: String,
          required: [true, "Certification title is required"],
          trim: true,
        },
        issuingOrganization: {
          type: String,
          trim: true,
        },
        issueDate: {
          type: Date,
        },
        expiryDate: {
          type: Date,
        },
        certificateNumber: {
          type: String,
          trim: true,
        },
      },
    ],

    // ── Experience
    experience: [
      {
        hospitalName: {
          type: String,
          required: [true, "Hospital name is required"],
          trim: true,
        },
        position: {
          type: String,
          trim: true,
          // e.g. Senior Consultant, Resident Doctor
        },
        from: {
          type: Date,
          required: [true, "Start date is required"],
        },
        to: {
          type: Date,
          default: null, // null means currently working
        },
        isCurrent: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes 
doctorSchema.index({ name: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ createdAt: -1 });

// ── Virtual: Total Years of Experience
doctorSchema.virtual("totalExperienceYears").get(function () {
  if (!this.experience || this.experience.length === 0) return 0;
  const totalMonths = this.experience.reduce((acc, exp) => {
    const start = new Date(exp.from);
    const end = exp.to ? new Date(exp.to) : new Date();
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return acc + months;
  }, 0);
  return Math.floor(totalMonths / 12);
});

// ── Auto-generate doctorId before save
doctorSchema.pre("save", async function () {
  if (!this.doctorId) {
    const count = await mongoose.model("Doctor").countDocuments();
    this.doctorId = `DOC-${String(count + 1).padStart(4, "0")}`;
  }

});

// ── Static: Find by Specialization
doctorSchema.statics.findBySpecialization = function (specialization) {
  return this.find({ specialization });
};

module.exports =
  mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);