const authorize = require('./authorize');

/**
 * requireAdmin middleware
 * Ensures the authenticated user has the 'ADMIN' role.
 */
const requireAdmin = authorize('ADMIN');

module.exports = requireAdmin;

