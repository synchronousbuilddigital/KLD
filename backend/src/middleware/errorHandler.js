const logger = require('../utils/logger');
const { captureException } = require('../utils/sentry');

/**
 * Global error handler middleware.
 * Must be the last middleware registered in app.js.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose: duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    if (field === 'email') {
      message = 'An account with this email address already exists.';
    } else {
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} is already registered.`;
    }
    statusCode = 409;
  }

  // Mongoose: validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    statusCode = 400;
  }

  // Mongoose: invalid ObjectId
  if (err.name === 'CastError') {
    message = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }

  // Report 500 server errors to Sentry & Pino logger
  if (statusCode >= 500) {
    captureException(err, { url: req.originalUrl, method: req.method, ip: req.ip });
  } else {
    logger.warn({ url: req.originalUrl, method: req.method, statusCode, message }, 'Client Request Error');
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
