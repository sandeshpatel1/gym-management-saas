const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Company = require('../models/Company');

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

    req.user = user; // includes .company, .role, .branchAccess
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, token invalid or expired');
  }
});

/**
 * authorize(...roles): route-level RBAC guard.
 * Usage: router.post('/', protect, authorize('owner', 'manager'), createX)
 *
 * Superadmin ALWAYS passes this check, regardless of which roles are listed.
 * This is what gives the platform admin full owner/manager/trainer-level
 * access to every gym's data once requireCompanyScope has resolved which
 * company they're acting on (see below).
 */
const authorize = (...roles) => (req, res, next) => {
  if (req.user?.role === 'superadmin') return next();
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user?.role}' is not permitted to perform this action`);
  }
  next();
};

/**
 * requireCompanyScope: resolves which company a request should be scoped to.
 * - Normal staff (manager/trainer): always their own req.user.company.
 * - Superadmin: has no company of their own, so they MUST tell us which gym
 *   they're managing via `?company=<id>` (the frontend sends this
 *   automatically once a superadmin picks "Manage" on a gym).
 * - Owner: usually just their own req.user.company (home branch). BUT if
 *   they operate multiple locations, the frontend's BranchSwitcher can send
 *   `?company=<id>` for any branch OTHER than their home one - and this is
 *   only honored if that id is actually in the owner's own `branchAccess`
 *   list, so an owner can never scope themselves into a gym they don't run.
 *
 * In every case we stamp the resolved id onto req.user.company for the rest
 * of this request only, so every existing controller (which just reads
 * req.user.company) keeps working completely unmodified.
 */
const requireCompanyScope = asyncHandler(async (req, res, next) => {
  const requestedCompanyId = req.query.company || req.headers['x-company-id'];

  if (req.user.role === 'superadmin') {
    if (!requestedCompanyId) {
      res.status(400);
      throw new Error('Select a gym to manage first (missing company scope)');
    }
    // Superadmin intentionally exempt from the active check below —
    // they need access to a deactivated gym in order to reactivate it.
    req.user.company = requestedCompanyId;
    req.isSuperadminActingAs = true;
    return next();
  }

  let targetCompanyId = req.user.company;

  if (requestedCompanyId && String(requestedCompanyId) !== String(req.user.company)) {
    if (req.user.role !== 'owner') {
      res.status(403);
      throw new Error('Only gym owners can switch between branches');
    }
    const hasAccess = (req.user.branchAccess || []).some(
      (id) => String(id) === String(requestedCompanyId)
    );
    if (!hasAccess) {
      res.status(403);
      throw new Error('You do not have access to that branch');
    }
    targetCompanyId = requestedCompanyId;
    req.isOwnerActingAsBranch = true;
  }

  if (!targetCompanyId) {
    res.status(403);
    throw new Error('This action requires an account scoped to a company');
  }

  // NEW: the check that was missing — covers the home company AND every
  // linked branch, on every single request, regardless of what the JWT
  // or session cached earlier.
  const company = await Company.findById(targetCompanyId).select('isActive name');
  if (!company || !company.isActive) {
    res.status(403);
    throw new Error(
      `${company?.name || 'This gym'} has been deactivated. Contact your platform admin.`
    );
  }

  req.user.company = targetCompanyId;
  next();
});

module.exports = { protect, authorize, requireCompanyScope };