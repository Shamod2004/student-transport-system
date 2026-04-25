const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token' })
  }
  try {
    const token = req.headers.authorization.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' })
    }
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' })
  }
}

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' })
  }
  if (String(req.user.role || '').toLowerCase() !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' })
  }
  next()
}

const requireDriverOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' })
  }
  const role = String(req.user.role || '').toLowerCase()
  if (role === 'admin' || role === 'driver') {
    return next()
  }
  return res.status(403).json({ message: 'Driver or admin access required' })
}

module.exports = { protect, requireAdmin, requireDriverOrAdmin }
