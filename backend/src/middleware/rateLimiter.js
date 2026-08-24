const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response');

/**
 * Strict Rate Limiter for Sensitive Auth Endpoints (OTP, Login, Password Reset)
 * Max 10 attempts per 15-minute window per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    return sendError(
      res,
      'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
      429
    );
  },
});

/**
 * General Rate Limiter for All API Endpoints
 * Max 300 requests per 15-minute window per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many requests from this IP address. Please slow down and try again shortly.',
      429
    );
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
