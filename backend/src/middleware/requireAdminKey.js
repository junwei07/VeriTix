const HttpError = require('../utils/httpError');

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

// Require a shared admin key for organizer-only actions.
const requireAdminKey = (req, _res, next) => {
  if (!ADMIN_API_KEY) {
    return next(new HttpError(500, 'ADMIN_API_KEY is not configured'));
  }

  const provided = req.header('x-admin-key');
  if (!provided || provided !== ADMIN_API_KEY) {
    return next(new HttpError(401, 'Admin key is invalid'));
  }
  return next();
};

module.exports = requireAdminKey;
