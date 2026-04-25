/**
 * One-time script to drop the stale employeeId_1 unique index from the drivers collection.
 * Run once with: node scripts/dropEmployeeIdIndex.js
 */
require('dotenv').config()
const mongoose = require('mongoose')

const run = async () => {
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('❌ MONGO_URI not found in .env')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log('✅ Connected to MongoDB')

  const collection = mongoose.connection.collection('drivers')

  // List current indexes so we can see what's there
  const indexes = await collection.indexes()
  console.log('Current indexes:', indexes.map(i => i.name))

  const staleIndex = indexes.find(i => i.name === 'employeeId_1')
  if (!staleIndex) {
    console.log('ℹ️  employeeId_1 index not found — nothing to drop.')
  } else {
    await collection.dropIndex('employeeId_1')
    console.log('✅ Dropped stale index: employeeId_1')
  }

  await mongoose.disconnect()
  console.log('Done.')
  process.exit(0)
}

run().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
