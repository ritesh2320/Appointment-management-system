const Doctor = require("../models/doctor");
const mongoose = require("mongoose");
const ApiError = require("../config/ApiError");
const { doctorSchema, updateDoctorSchema } = require("../validations/doctorValidations");

// ── Create Doctor

exports.createDoctor = async (req, res, next) => {
  try {
    const { error, value } = doctorSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      throw new ApiError(
        400,
        "Validation failed",
        error.details.map((d) => d.message)
      );
    }

    const doctor = await Doctor.create({
      ...value,
      createdBy: req.user?.id,
    });

    return res.status(201).json({
      message: "Doctor created successfully",
      doctor,
    });
  } catch (err) {
    next(err);
  }
};

// ── Get All Doctors

exports.getAllDoctors = async (req, res, next) => {
  try {
    const { specialization, search, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Doctor.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "Doctors fetched successfully",
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      doctors,
    });
  } catch (err) {
    next(err);
  }
};

// ── Get Single Doctor

exports.getDoctorById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new ApiError(400, "Invalid Doctor ID");
    }

    const doctor = await Doctor.findById(req.params.id).select("-__v");

    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    return res.status(200).json({
      message: "Doctor fetched successfully",
      doctor,
    });
  } catch (err) {
    next(err);
  }
};

// ── Update Doctor

exports.updateDoctor = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new ApiError(400, "Invalid Doctor ID");
    }

    const { error, value } = updateDoctorSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      throw new ApiError(
        400,
        "Validation failed",
        error.details.map((d) => d.message)
      );
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { ...value, updatedBy: req.user?.id },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    return res.status(200).json({
      message: "Doctor updated successfully",
      doctor,
    });
  } catch (err) {
    next(err);
  }
};

// ── Delete Doctor

exports.deleteDoctor = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new ApiError(400, "Invalid Doctor ID");
    }

    const doctor = await Doctor.findByIdAndDelete(req.params.id);

    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    return res.status(200).json({
      message: "Doctor deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ── Get Doctor by Specialization

exports.getDoctorsBySpecialization = async (req, res) => {
  try {
    const { specialization } = req.params;
    const doctors = await Doctor.findBySpecialization(specialization).select("-__v");
    return res.status(200).json({
      message: "Doctors fetched successfully",
      total: doctors.length,
      doctors,
    });
  } catch (err) {
    return handleError(res, err);
  }
};

module.exports = exports;