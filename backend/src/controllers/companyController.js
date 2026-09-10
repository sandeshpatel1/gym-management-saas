const asyncHandler = require('express-async-handler');
const Company = require('../models/Company');
const User = require('../models/User');
const QRCode = require('qrcode');
const PlatformSettings = require('../models/PlatformSettings'); // add near top with other requires
const { encrypt, decrypt, mask } = require('../utils/crypto');   // add near top



/**
 * @desc  Returns which gateway this gym has configured, with credentials
 *        MASKED (never sends decrypted secrets to the browser).
 * @route GET /api/companies/:id/gateway-settings
 * @access Private (that gym's owner, or superadmin)
 */
const getGatewaySettings = asyncHandler(async (req, res) => {
  if (req.user.role !== 'superadmin' && String(req.user.company) !== req.params.id) {
    res.status(403);
    throw new Error("You can only view your own gym's gateway settings");
  }
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  const rawCredentials = company.paymentSettings?.gateway?.credentials || {};
  const maskedCredentials = {};
  Object.entries(rawCredentials).forEach(([k, v]) => {
    maskedCredentials[k] = mask(decrypt(v));
  });
  res.json({
    success: true,
    data: {
      provider: company.paymentSettings?.gateway?.provider || '',
      isLive: !!company.paymentSettings?.gateway?.isLive,
      credentials: maskedCredentials,
      configured: Object.keys(rawCredentials).length > 0,
    },
  });
});

/**
 * @desc  Save/update this gym's gateway provider + credentials. Fields left
 *        blank keep their previously stored (encrypted) value, so an owner
 *        editing one field doesn't wipe another they aren't re-typing.
 * @route PUT /api/companies/:id/gateway-settings
 * @access Private (that gym's owner, or superadmin)
 */
const updateGatewaySettings = asyncHandler(async (req, res) => {
  if (req.user.role !== 'superadmin' && String(req.user.company) !== req.params.id) {
    res.status(403);
    throw new Error("You can only update your own gym's gateway settings");
  }
  const { provider, credentials, isLive } = req.body;
  if (!provider) {
    res.status(400);
    throw new Error('provider is required');
  }

  const settings = await PlatformSettings.getSingleton();
  const providerDef = settings.gatewayProviders.find((g) => g.key === provider && g.enabled);
  if (!providerDef) {
    res.status(400);
    throw new Error('That payment gateway is not available on this platform. Ask your platform admin to enable it.');
  }

  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }

  const encryptedCredentials = {};
  providerDef.fields.forEach((f) => {
    const incoming = credentials?.[f.name];
    if (incoming === undefined || incoming === '') {
      const existing = company.paymentSettings?.gateway?.credentials?.[f.name];
      if (existing) encryptedCredentials[f.name] = existing;
      return;
    }
    encryptedCredentials[f.name] = encrypt(incoming);
  });

  company.paymentSettings = company.paymentSettings || {};
  company.paymentSettings.gateway = { provider, credentials: encryptedCredentials, isLive: !!isLive };
  await company.save();

  res.json({ success: true, message: 'Gateway settings saved' });
});




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
 * @route PUT /api/companies/:id
 * @access Private (superadmin, or owner of that company)
 */
const updateCompany = asyncHandler(async (req, res) => {
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

/**
 * @desc  Renders a scannable UPI deep-link QR (upi://pay?...) for THIS gym's
 *        configured VPA, for a given amount. No money moves through this
 *        server — it just deep-links into whatever UPI app the member has.
 * @route GET /api/companies/:id/upi-qr?amount=&note=
 * @access Private (any tenant-scoped user for their own gym)
 */
const getUpiQrPreview = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  const vpa = company.paymentSettings?.upi?.vpa;
  if (!vpa) {
    res.status(400);
    throw new Error('UPI ID is not configured for this gym yet — set it under Gym Settings');
  }
  const amount = Number(req.query.amount || 0);
  const note = (req.query.note || 'Payment').slice(0, 40);
  const payeeName = company.paymentSettings?.upi?.payeeName || company.name;

  const upiUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrBuffer = await QRCode.toBuffer(upiUri, { width: 300, margin: 1 });

  res.setHeader('Content-Type', 'image/png');
  res.send(qrBuffer);
});

module.exports = {
  getCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  setCompanyStatus,
  getUpiQrPreview,
  getGatewaySettings,
  updateGatewaySettings,
};