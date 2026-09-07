const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Company = require('../models/Company');
const generateToken = require('../utils/generateToken');

const PHONE_REGEX = /^[+]?[0-9]{10,15}$/;
const URL_REGEX = /^https?:\/\/.+/i;

/**
 * @desc  Login - single shared login page. Company is auto-detected from
 *        the user's own account (user.company), never chosen at login time.
 * @route POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password')
    .populate('company', 'name code branding isActive');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated. Contact your gym admin.');
  }

  if (user.company && !user.company.isActive) {
    res.status(403);
    throw new Error('Your gym account is currently inactive. Contact support.');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      company: user.company
        ? {
            id: user.company._id,
            name: user.company.name,
            code: user.company.code,
            branding: user.company.branding, // dynamic logo/colors picked up immediately on login
          }
        : null,
    },
  });
});

/**
 * @desc  Register the FIRST owner account for a brand-new gym (self-serve signup).
 *        Creates the Company + the owner User in one transaction-like flow.
 * @route POST /api/auth/register-company
 * @access Public
 */
const registerCompany = asyncHandler(async (req, res) => {
  const { companyName, companyCode, ownerName, email, password, phone } = req.body;

  if (!companyName || !companyCode || !ownerName || !email || !password) {
    res.status(400);
    throw new Error('companyName, companyCode, ownerName, email and password are required');
  }

  const existingCompany = await Company.findOne({ code: companyCode.toUpperCase() });
  if (existingCompany) {
    res.status(409);
    throw new Error('This company code is already taken, please choose another');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const company = await Company.create({
    name: companyName,
    code: companyCode.toUpperCase(),
  });

  const user = await User.create({
    company: company._id,
    name: ownerName,
    email,
    password,
    phone,
    role: 'owner',
  });

  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: { id: company._id, name: company.name, code: company.code, branding: company.branding },
    },
  });
});

/**
 * @desc  Current logged-in user (used on app load to restore session)
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    'company',
    'name code branding isActive settings'
  );
  res.json({ success: true, user });
});

/**
 * @desc  Update the LOGGED-IN user's own basic profile (name, phone, avatar).
 *        Name and phone are mandatory and validated; avatarUrl, if provided,
 *        must look like a real URL. Optionally change password in the same
 *        call by also sending currentPassword + newPassword.
 * @route PUT /api/auth/me
 * @access Private
 */
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, avatarUrl, currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (name !== undefined) {
    if (!name.trim()) {
      res.status(400);
      throw new Error('Name is required');
    }
    user.name = name.trim();
  }

  if (phone !== undefined) {
    if (!phone.trim()) {
      res.status(400);
      throw new Error('Phone number is required');
    }
    if (!PHONE_REGEX.test(phone.trim())) {
      res.status(400);
      throw new Error('Enter a valid phone number');
    }
    user.phone = phone.trim();
  }

  if (avatarUrl !== undefined) {
    if (avatarUrl.trim() && !URL_REGEX.test(avatarUrl.trim())) {
      res.status(400);
      throw new Error('Avatar URL must be a valid http(s) link');
    }
    user.avatarUrl = avatarUrl.trim();
  }

  if (newPassword) {
    if (!currentPassword) {
      res.status(400);
      throw new Error('Enter your current password to set a new one');
    }
    const matches = await user.matchPassword(currentPassword);
    if (!matches) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }
    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters');
    }
    user.password = newPassword; // re-hashed by the pre-save hook
  }

  await user.save();

  const populated = await User.findById(user._id).populate(
    'company',
    'name code branding isActive settings'
  );

  res.json({
    success: true,
    user: {
      id: populated._id,
      name: populated.name,
      email: populated.email,
      phone: populated.phone,
      role: populated.role,
      avatarUrl: populated.avatarUrl,
      isActive: populated.isActive,
      createdAt: populated.createdAt,
      lastLoginAt: populated.lastLoginAt,
      company: populated.company
        ? {
            id: populated.company._id,
            name: populated.company.name,
            code: populated.company.code,
            branding: populated.company.branding,
          }
        : null,
    },
  });
});

module.exports = { login, registerCompany, getMe, updateMe };