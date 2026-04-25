const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    studentId: {
      type: String,
      required: true,
      unique: true
    },
    phone: {
      type: String
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"]
    },
    dateOfBirth: {
      type: Date
    },
    address: {
      type: String
    },
    major: {
      type: String
    },
    yearLevel: {
      type: String,
      enum: ["1st", "2nd", "3rd", "4th"]
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "graduated"]
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
