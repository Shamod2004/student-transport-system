const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
  {
    busImageUrl: {
      type: String,
      trim: true,
      default: ""
    },
    busId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    routeName: {
      type: String,
      required: true,
      trim: true
    },
    busType: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["Certified", "Pending", "Cancelled"],
      default: "Certified"
    },
    departureTime: {
      type: String,
      required: true,
      match: /^([01]?\d|2[0-3]):[0-5]\d$/
    },
    arrivalTime: {
      type: String,
      required: true,
      match: /^([01]?\d|2[0-3]):[0-5]\d$/
    },
    departureLocation: {
      type: String,
      required: true,
      trim: true
    },
    arrivalLocation: {
      type: String,
      required: true,
      trim: true
    },
    departureDate: {
      type: Date,
      required: true
    },
    price: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  { timestamps: true }
);

routeSchema.index({ routeName: 1 });
routeSchema.index({ departureLocation: 1, arrivalLocation: 1 });
routeSchema.index({ departureDate: 1 });

module.exports = mongoose.model("Route", routeSchema);
