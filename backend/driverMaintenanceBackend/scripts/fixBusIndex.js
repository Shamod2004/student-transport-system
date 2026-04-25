/**
 * fixBusIndex.js
 * Run: node scripts/fixBusIndex.js
 *
 * The E11000 error was on { busNo: null } — an old field from a previous schema.
 * This script drops all stale indexes (busNo_1, plateNumber_1) and rebuilds cleanly.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')
const Bus = require('../models/Bus')

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI

async function run() {
  if (!MONGO_URI) {
    console.error('❌ No MONGO_URI found in .env')
    process.exit(1)
  }

  console.log('🔌 Connecting to MongoDB...')
  await mongoose.connect(MONGO_URI)
  console.log('✅ Connected\n')

  // 1. Show ALL buses (raw, bypasses Mongoose)
  const allBuses = await Bus.collection.find({}).toArray()
  console.log(`📦 Total buses in collection: ${allBuses.length}`)
  allBuses.forEach(b => {
    console.log(`   → _id: ${b._id} | plateNumber: "${b.plateNumber}" | busNo: "${b.busNo}" | brand: "${b.brand}"`)
  })

  // 2. List current indexes BEFORE changes
  const indexesBefore = await Bus.collection.indexes()
  console.log('\n📋 Indexes BEFORE cleanup:')
  indexesBefore.forEach(idx => console.log(`   → ${JSON.stringify(idx)}`))

  // 3. Drop the STALE busNo_1 index (old schema field — the actual cause of E11000)
  console.log('\n🔧 Dropping stale busNo_1 index (old schema field)...')
  try {
    await Bus.collection.dropIndex('busNo_1')
    console.log('   ✅ Dropped busNo_1 index — ROOT CAUSE FIXED')
  } catch (e) {
    if (e.codeName === 'IndexNotFound') {
      console.log('   ℹ️  busNo_1 index not found (already removed)')
    } else {
      console.error('   ❌ Error:', e.message)
    }
  }

  // 4. Drop plateNumber_1 and rebuild it cleanly
  console.log('\n🔧 Dropping plateNumber_1 index for clean rebuild...')
  try {
    await Bus.collection.dropIndex('plateNumber_1')
    console.log('   ✅ Dropped plateNumber_1')
  } catch (e) {
    if (e.codeName === 'IndexNotFound') {
      console.log('   ℹ️  plateNumber_1 not found (will be created fresh)')
    } else {
      console.error('   ❌ Error:', e.message)
    }
  }

  // 5. Remove any documents with null/empty busNo that could re-trigger conflicts
  const nullBusNo = allBuses.filter(b => b.busNo !== undefined)
  if (nullBusNo.length > 0) {
    console.log(`\n🧹 Found ${nullBusNo.length} doc(s) with stale busNo field. Unsetting busNo...`)
    await Bus.collection.updateMany(
      { busNo: { $exists: true } },
      { $unset: { busNo: '' } }
    )
    console.log('   ✅ Removed busNo field from all documents')
  }

  // 6. Sync indexes from current schema (recreates plateNumber_1 cleanly)
  console.log('\n🔧 Running syncIndexes to apply current schema...')
  await Bus.syncIndexes()
  console.log('   ✅ Indexes synced\n')

  // 7. Show final state
  const indexesAfter = await Bus.collection.indexes()
  console.log('📋 Indexes AFTER cleanup:')
  indexesAfter.forEach(idx => console.log(`   → ${JSON.stringify(idx)}`))

  const finalBuses = await Bus.collection.find({}).toArray()
  console.log(`\n📦 Final bus count: ${finalBuses.length}`)
  finalBuses.forEach(b => {
    console.log(`   → _id: ${b._id} | plateNumber: "${b.plateNumber}" | brand: "${b.brand}"`)
  })

  await mongoose.disconnect()
  console.log('\n✅ All done! Restart your server and try registering a bus again.')
}

run().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
