const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Company = require('../models/Company');

/**
 * @desc  List staff users (the "User Master" table). Owners/managers see only
 *        their own company's staff. Superadmin sees every staff account on
 *        the platform, each populated with which gym it belongs to, and can
 *        optionally filter to one gym with ?company=<companyId>.
 * @route GET /api/users
 * @access Private (owner, manager, superadmin)
 */
const getUsers = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'superadmin' ? {} : { company: req.user.company };
  if (req.user.role === 'superadmin' && req.query.company) {
    filter.company = req.query.company;
  }

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .populate('company', 'name code');

  res.json({ success: true, count: users.length, data: users });
});

/**
 * @desc  Create a staff user. Owners create staff under their own company
 *        automatically. Superadmin can create a login for ANY gym by
 *        passing `company` in the body — this is how the platform admin
 *        issues gym logins entirely from the frontend, with no database
 *        access required.
 * @route POST /api/users
 * @access Private (owner, superadmin)
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, company } = req.body;

  if (!['manager', 'trainer', 'owner'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role for a company user');
  }

  let companyId;
  if (req.user.role === 'superadmin') {
    if (!company) {
      res.status(400);
      throw new Error('company is required when creating a login as superadmin');
    }
    const companyDoc = await Company.findById(company);
    if (!companyDoc) {
      res.status(404);
      throw new Error('Company not found');
    }
    companyId = companyDoc._id;
  } else {
    companyId = req.user.company;
  }

  const user = await User.create({
    company: companyId,
    name,
    email,
    password,
    phone,
    role,
  });

  res.status(201).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: companyId,
      createdAt: user.createdAt,
    },
  });
});

/**
 * @desc  Update a staff user's details/role/active-state
 * @route PUT /api/users/:id
 * @access Private (owner, superadmin)
 */
const updateUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) {
    res.status(404);
    throw new Error('User not found');
  }
  if (req.user.role !== 'superadmin' && String(target.company) !== String(req.user.company)) {
    res.status(403);
    throw new Error('Cannot modify a user outside your company');
  }

  const { name, phone, role, isActive } = req.body;
  if (name !== undefined) target.name = name;
  if (phone !== undefined) target.phone = phone;
  if (role !== undefined) target.role = role;
  if (isActive !== undefined) target.isActive = isActive;

  await target.save();
  res.json({ success: true, data: target });
});

/**
 * @desc  Delete/deactivate a staff user
 * @route DELETE /api/users/:id
 * @access Private (owner, superadmin)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) {
    res.status(404);
    throw new Error('User not found');
  }
  if (req.user.role !== 'superadmin' && String(target.company) !== String(req.user.company)) {
    res.status(403);
    throw new Error('Cannot remove a user outside your company');
  }
  await target.deleteOne();
  res.json({ success: true, message: 'User removed' });
});

module.exports = { getUsers, createUser, updateUser, deleteUser };