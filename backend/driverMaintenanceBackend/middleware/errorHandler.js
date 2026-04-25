/**
 * errorHandler.js
 * Provides catchAsync wrapper and AppError class used by routeController.js
 */

/**
 * Wraps an async route handler and forwards any errors to Express error middleware.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

/**
 * Operational error with an HTTP status code.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = { catchAsync, AppError }
