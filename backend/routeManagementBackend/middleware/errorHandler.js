// Custom error class eka create karanna
class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Parent class constructor call karanna
        
        this.statusCode = statusCode; // HTTP status code eka set karanna
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // Status eka set karanna
        this.isOperational = true; // Operational error kiyla mark karanna
        
        Error.captureStackTrace(this, this.constructor); // Stack trace capture karanna
    }
}

// Async error wrapper function - async functions handle karanna
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next); // Async function eka try-catch wrapper ekak danna
    };
};

// Development environment error response
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack // Full stack trace send karanna
    });
};

// Production environment error response
const sendErrorProd = (err, res) => {
    // Operational errors - client ekata send karanna
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        // Programming errors - don't leak error details
        console.error('ERROR 💥', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        });
    }
};

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    // Environment base karanna error response decide karanna
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        sendErrorProd(err, res);
    }
};

module.exports = {
    AppError,
    catchAsync,
    globalErrorHandler
};
