const mongoose = require("mongoose");

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri =
    process.env.MONGO_URI_LOCAL || "mongodb://127.0.0.1:27017/student-transport-system";

  const candidates = [primaryUri, fallbackUri].filter(Boolean);
  const options = {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4
  };

  let lastError = null;

  for (const uri of candidates) {
    try {
      await mongoose.connect(uri, options);
      process.env.ACTIVE_MONGO_URI = uri;
      console.log(`MongoDB connected (${uri === primaryUri ? "primary" : "fallback"})`);
      return;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB connection failed for ${uri === primaryUri ? "primary" : "fallback"} URI: ${error.message}`);
    }
  }

  throw lastError || new Error("Unable to connect to MongoDB");
};

module.exports = connectDB;
