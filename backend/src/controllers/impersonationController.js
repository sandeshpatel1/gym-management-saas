const asyncHandler = require('express-async-handler');
const ImpersonationLog = require('../models/ImpersonationLog');
const Company = require('../models/Company');

/**
 * @desc  Logs the start of a superadmin "Manage this gym" session. Called
 *        by the frontend the instant startManaging() fires.
 * @route POST /api/impersonation/:companyId/start
 * @access Private (superadmin)
 */
const startImpersonation = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.companyId).select('name');
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  await ImpersonationLog.create({
    superadmin: req.user._id,
    superadminName: req.user.name,
    company: company._id,
    companyName: company.name,
    action: 'enter',
  });
  res.status(201).json({ success: true });
});

/**
 * @desc  Logs the end of a superadmin impersonation session (Exit button,
 *        or logging out while still managing a gym).
 * @route POST /api/impersonation/:companyId/end
 * @access Private (superadmin)
 */
const endImpersonation = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.companyId).select('name');
  await ImpersonationLog.create({
    superadmin: req.user._id,
    superadminName: req.user.name,
    company: req.params.companyId,
    companyName: company?.name || '',
    action: 'exit',
  });
  res.status(201).json({ success: true });
});

/**
 * @desc  Paginated audit log, newest first. Optional filters:
 *        ?company=<id>&superadmin=<id>&action=enter|exit|write
 * @route GET /api/impersonation
 * @access Private (superadmin)
 */
const getImpersonationLogs = asyncHandler(async (req, res) => {
  const { company, superadmin, action, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (company) filter.company = company;
  if (superadmin) filter.superadmin = superadmin;
  if (action) filter.action = action;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const [logs, total] = await Promise.all([
    ImpersonationLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
    ImpersonationLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: { total, page: pageNumber, pages: Math.ceil(total / limitNumber) },
  });
});

module.exports = { startImpersonation, endImpersonation, getImpersonationLogs };