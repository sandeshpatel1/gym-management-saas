const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

/**
 * protect: verifies the JWT, loads the user, and attaches req.user.
 * req.user.company (an ObjectId or null for superadmin) is THE tenant scope
 * every controller must filter by.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      res.status(401);
      throw new Error('User not found or deactivated');
    }

    req.user = user; // includes .company, .role
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, token invalid or expired');
  }
});

/**
 * authorize(...roles): route-level RBAC guard.
 * Usage: router.post('/', protect, authorize('owner', 'manager'), createX)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user?.role}' is not permitted to perform this action`);
  }
  next();
};

/**
 * requireCompanyScope: blocks superadmin-only accounts from tenant-data routes
 * (they manage the Company Master, not member/attendance/revenue data directly).
 */
const requireCompanyScope = (req, res, next) => {
  if (!req.user.company) {
    res.status(403);
    throw new Error('This action requires an account scoped to a company');
  }
  next();
};

module.exports = { protect, authorize, requireCompanyScope };
