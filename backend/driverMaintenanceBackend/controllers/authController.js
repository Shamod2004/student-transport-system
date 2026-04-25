const User = require('../models/User')
const generateToken = require('../utils/generateToken')

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body
  try {
    // Normalize email to lowercase for case-insensitive lookup
    const user = await User.findOne({ email: String(email || '').toLowerCase().trim() })
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body
  try {
    const normalizedEmail = String(email || '').toLowerCase().trim()
    const exists = await User.findOne({ email: normalizedEmail })
    if (exists) return res.status(400).json({ message: 'User already exists' })
    const userRole = role || 'admin'
    const user = await User.create({ name, email: normalizedEmail, password, role: userRole })

    // NOTE: Driver profile is NOT auto-created here.
    // Admins add driver profiles manually via DriverManagement with a real license number.

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}
