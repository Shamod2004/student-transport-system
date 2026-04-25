const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const busPassRoutes = require("./Routes/BusPassRoutes");
const BusPass = require("./Model/BusPassModel");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/buspasses", busPassRoutes);

// Payment route
app.post("/api/payment", async (req, res) => {
  const { studentId, studentName, travelRoute, startDate, validityPeriod, payment } = req.body;

  try {
    const busPass = new BusPass({
      studentId,
      studentName,
      travelRoute,
      startDate: new Date(startDate),
      validityPeriod,
      paymentMade: true, // Since payment is being processed
    });
    await busPass.save();

    return res.status(201).json({ success: true, busPass });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Unable to create bus pass" });
  }
});

//server runing
app.get("/", (req, res) => {
  res.send("Server is working!");
});


mongoose
  .connect("mongodb+srv://kavishkadilshanit_db_user:3m1V4HPQEZKfA8qE@cluster0.hfh2i4s.mongodb.net/")
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  })
  .catch((err) => console.log(err));
