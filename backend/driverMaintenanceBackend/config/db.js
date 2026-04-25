const mongoose = require('mongoose')

const connectDB = async () => {
  // Read MONGO_URI inside the function so dotenv.config() in server.js
  // has already run by the time this is called.
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('❌ MONGO_URI is not defined. Check your .env file.')
    process.exit(1)
  }
  try {
    const conn = await mongoose.connect(uri)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
