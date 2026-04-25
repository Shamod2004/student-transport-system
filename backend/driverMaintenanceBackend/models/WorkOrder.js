const mongoose = require('mongoose')

const workOrderSchema = new mongoose.Schema(
  {
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    issueTitle: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'In Progress',
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    ticketId: { type: String, unique: true },
  },
  { timestamps: true }
)

// Auto-generate ticket ID (e.g. #MT-1045) before saving
workOrderSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    // Use a timestamp + random suffix to avoid race conditions on concurrent inserts
    const ts = Date.now().toString().slice(-6)
    const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    this.ticketId = `#MT-${ts}${rand}`
  }
  next()
})

module.exports = mongoose.model('WorkOrder', workOrderSchema)
