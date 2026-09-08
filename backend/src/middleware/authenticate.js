const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * authenticate middleware
 * Verifies the Bearer token in the Authorization header.
 * Attaches req.user = { id, email, plan } on success.
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('email isVerified role refreshToken');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before continuing.',
      });
    }

    // Auto set HttpOnly cookies on response if missing
    if (!req.cookies?.accessToken) {
      const { setAuthCookies, generateRefreshToken } = require('../utils/jwt');
      const refreshToken = user.refreshToken || generateRefreshToken(user._id);
      setAuthCookies(res, token, refreshToken);
    }

    req.user = { id: user._id.toString(), email: user.email, role: user.role || 'USER' };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * optionalAuthenticate middleware
 * If a token is provided and valid, attaches req.user.
 * If no token or invalid/expired, still allows the request to continue as a guest (req.user = null).
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('email isVerified role refreshToken');

    if (user && user.isVerified) {
      req.user = { id: user._id.toString(), email: user.email, role: user.role || 'USER' };
    } else {
      req.user = null;
    }
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

module.exports = authenticate;
module.exports.authenticate = authenticate;
module.exports.optionalAuthenticate = optionalAuthenticate;

