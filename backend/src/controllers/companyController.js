const asyncHandler = require('express-async-handler');
const Company = require('../models/Company');
const User = require('../models/User');

/**
 * @desc  List all companies (platform-wide Company Master table)
 * @route GET /api/companies
 * @access Private (superadmin)
 */
const getCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find().sort({ createdAt: -1 });
  res.json({ success: true, count: companies.length, data: companies });
});

/**
 * @desc  Create a new company (superadmin onboarding a gym). Optionally also
 *        creates the gym's first OWNER login in the same step (pass
 *        ownerName / ownerEmail / ownerPassword / ownerPhone) so superadmin
 *        never has to open MongoDB Atlas to give a gym access — the whole
 *        flow (gym + first login) happens from the frontend.
 * @route POST /api/companies
 * @access Private (superadmin)
 */
const createCompany = asyncHandler(async (req, res) => {
  const { name, code, contact, ownerName, ownerEmail, ownerPassword, ownerPhone } = req.body;

  if (!name || !code) {
    res.status(400);
    throw new Error('name and code are required');
  }

  const existingCompany = await Company.findOne({ code: code.toUpperCase() });
  if (existingCompany) {
    res.status(409);
    throw new Error('This company code is already taken, please choose another');
  }

  // If any owner field was provided, require all three so we never create a
  // half-broken login.
  const wantsOwner = ownerName || ownerEmail || ownerPassword;
  if (wantsOwner && (!ownerName || !ownerEmail || !ownerPassword)) {
    res.status(400);
    throw new Error('ownerName, ownerEmail and ownerPassword are all required to create an owner login');
  }
  if (wantsOwner) {
    const existingUser = await User.findOne({ email: ownerEmail.toLowerCase() });
    if (existingUser) {
      res.status(409);
      throw new Error('An account with this owner email already exists');
    }
  }

  const company = await Company.create({ name, code: code.toUpperCase(), contact });

  let ownerUser = null;
  if (wantsOwner) {
    ownerUser = await User.create({
      company: company._id,
      name: ownerName,
      email: ownerEmail,
      password: ownerPassword,
      phone: ownerPhone,
      role: 'owner',
    });
  }

  res.status(201).json({
    success: true,
    data: company,
    owner: ownerUser
      ? {
          id: ownerUser._id,
          name: ownerUser.name,
          email: ownerUser.email,
          createdAt: ownerUser.createdAt,
        }
      : null,
  });
});

/**
 * @desc  Get single company
 * @route GET /api/companies/:id
 * @access Private (superadmin, or owner of that company)
 */
const getCompanyById = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  res.json({ success: true, data: company });
});

/**
 * @desc  Update company - name, contact, branding, settings, subscription.
 *        Accepts any of these nested objects in the body, so this single
 *        endpoint is what the superadmin Edit Gym form (and the owner's own
 *        Settings page) both use to change anything about a gym without
 *        touching the database directly.
 * @route PUT /api/companies/:id
 * @access Private (superadmin, or owner of that company)
 */
const updateCompany = asyncHandler(async (req, res) => {
  // Non-superadmin users may only touch their own company
  if (req.user.role !== 'superadmin' && String(req.user.company) !== req.params.id) {
    res.status(403);
    throw new Error('You can only update your own company');
  }

  const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }

  res.json({ success: true, data: company });
});

/**
 * @desc  Activate/deactivate a tenant
 * @route PATCH /api/companies/:id/status
 * @access Private (superadmin)
 */
const setCompanyStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const company = await Company.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true }
  );
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  res.json({ success: true, data: company });
});

module.exports = { getCompanies, createCompany, getCompanyById, updateCompany, setCompanyStatus };