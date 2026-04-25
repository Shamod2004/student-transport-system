const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const connectDB = require('./config/db')
const { errorHandler } = require('./middleware/errorMiddleware')
const dns = require('dns')
const User = require('./models/User')
const Driver = require('./models/Driver')

// Set Google DNS to prevent ECONNREFUSED DNS resolution issues with MongoDB SRV
dns.setServers(['8.8.8.8', '8.8.4.4'])

// Load env vars
dotenv.config()

// Connect to MongoDB
connectDB()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/buses', require('./routes/busRoutes'))
app.use('/api/drivers', require('./routes/driverRoutes'))
app.use('/api/inspections', require('./routes/inspectionRoutes'))
app.use('/api/leaves', require('./routes/leaveRoutes'))
app.use('/api/route-assignments', require('./routes/routeAssignmentRoutes'))
app.use('/api/maintenance', require('./routes/maintenanceRoutes'))
app.use('/api/condition-reports', require('./routes/conditionReportRoutes'))
app.use('/api/work-orders', require('./routes/workOrderRoutes'))
app.use('/api/routes', require('./routes/routeRoutes'))

// Health check
app.get('/', (req, res) => res.send('🚌 Driver & Bus Maintenance API is running...'))

const ensureDriverUser = async () => {
	const driverEmail = 'driver1@gmail.com'
	const driverPassword = '222222'
	const driverName = 'Driver One'
	const driverLicense = 'DL-DRIVER-001'
	const driverContact = 'Pending Update'

	const normalizedEmail = driverEmail.toLowerCase()
	let user = await User.findOne({ email: normalizedEmail })

	if (!user) {
		user = await User.create({
			name: driverName,
			email: normalizedEmail,
			password: driverPassword,
			role: 'driver',
		})
	} else {
		// Only fix role/password if broken — never overwrite name or other fields
		let shouldSave = false
		if (user.role !== 'driver') { user.role = 'driver'; shouldSave = true }
		const passwordMatches = await user.matchPassword(driverPassword)
		if (!passwordMatches) { user.password = driverPassword; shouldSave = true }
		if (shouldSave) await user.save()
	}

	// Only create the driver profile if it doesn't exist yet.
	// Never overwrite fields — admins manage driver data via DriverManagement.
	const driver = await Driver.findOne({ userAccount: user._id })
	if (!driver) {
		// Check if the seed license is already taken by another record before creating
		const licenseInUse = await Driver.findOne({ licenseNumber: driverLicense })
		if (!licenseInUse) {
			await Driver.create({
				name: driverName,
				licenseNumber: driverLicense,
				contactNumber: driverContact,
				email: normalizedEmail,
				status: 'Active',
				userAccount: user._id,
			})
		}
	}
}

// Error handler (must be last)
app.use(errorHandler)

const PORT = process.env.DRIVER_MAINTENANCE_PORT || 5002

const startServer = async () => {
	try {
		await ensureDriverUser()
		app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
	} catch (err) {
		console.error('Failed to start server:', err.message)
		process.exit(1)
	}
}

startServer()
