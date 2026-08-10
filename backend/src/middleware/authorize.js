const { sendError } = require('../utils/response');

/**
 * authorize middleware factory
 * Checks if the authenticated user (req.user) has one of the required roles.
 * Usage:
 *   router.use(authenticate, authorize('ADMIN'));
 *   router.use(authenticate, authorize(['ADMIN', 'MANAGER']));
 */
const authorize = (...roles) => {
  const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;

  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Access denied. Insufficient permissions.', 403);
    }

    next();
  };
};

module.exports = authorize;
