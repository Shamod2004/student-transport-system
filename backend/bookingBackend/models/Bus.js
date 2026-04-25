const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: true,
      unique: true
    },
    route: {
      type: String,
      required: true
    },
    capacity: {
      type: Number,
      required: true,
      default: 45
    },
    currentOccupancy: {
      type: Number,
      default: 0
    },
    operatorName: {
      type: String
    },
    operatorPhone: {
      type: String
    },
    operatorEmail: {
      type: String
    },
    departureTime: {
      type: String
    },
    estimatedArrivalTime: {
      type: String
    },
    pricePerSeat: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "maintenance"]
    },
    seats: [
      {
        seatNumber: String,
        isOccupied: {
          type: Boolean,
          default: false
        },
        passengerName: String,
        passengerId: String
      }
    ]
  },
  { timestamps: true }
);

// Initialize seats when capacity changes
busSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("capacity")) {
    // Generate seat numbers
    const seats = [];
    const rows = Math.ceil(this.capacity / 4);
    const columns = 4;
    let seatCount = 1;

    for (let i = 0; i < rows && seatCount <= this.capacity; i++) {
      for (let j = 0; j < columns && seatCount <= this.capacity; j++) {
        const seatLetter = String.fromCharCode(65 + i); // A, B, C, etc.
        seats.push({
          seatNumber: `${seatLetter}-${String(j + 1).padStart(2, "0")}`,
          isOccupied: false
        });
        seatCount++;
      }
    }
    this.seats = seats;
  }
  next();
});

module.exports = mongoose.model("Bus", busSchema);
