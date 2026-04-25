const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    type: {
      type: String,
      enum: ["gender-seat-alert"],
      default: "gender-seat-alert"
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    metadata: {
      selectedSeatId: { type: String, trim: true },
      adjacentSeatId: { type: String, trim: true },
      canChangeSeat: { type: Boolean, default: false },
      actionLabel: { type: String, trim: true },
      secondaryActionLabel: { type: String, trim: true },
      redirectTo: { type: String, trim: true }
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Notification", notificationSchema);