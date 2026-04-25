const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "student"],
      default: "student"
    },
    adminType: {
      type: String,
      enum: ["general", "driver-maintenance", "route-management"],
      default: "general"
    },
    studentId: {
      type: String,
      unique: true,
      sparse: true
    },
    phone: {
      type: String,
      default: ""
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"]
    },
    address: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
