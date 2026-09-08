const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const QRCode = require('qrcode');
const KioskSession = require('../models/KioskSession');
const Company = require('../models/Company');
const Member = require('../models/Member');
const Attendance = require('../models/Attendance');

const TOKEN_LIFETIME_SECONDS = 30; // how long one displayed QR code stays valid

const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * @desc  Start (or rotate) a kiosk attendance session for this company.
 *        The kiosk screen calls this on a timer to keep swapping in a
 *        fresh token before the old one expires.
 * @route POST /api/kiosk/session
 * @access Private (owner, manager, trainer)
 */
const startKioskSession = asyncHandler(async (req, res) => {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_SECONDS * 1000);

  const session = await KioskSession.create({
    company: req.user.company,
    token,
    createdBy: req.user._id,
    expiresAt,
  });

  res.status(201).json({
    success: true,
    data: {
      token: session.token,
      expiresAt: session.expiresAt,
      lifetimeSeconds: TOKEN_LIFETIME_SECONDS,
    },
  });
});

/**
 * @desc  Renders the QR code image (PNG) for a kiosk token. The kiosk page
 *        fetches this as an authenticated blob (same pattern the old member
 *        QR feature used), so the token is never exposed via a public,
 *        unauthenticated image URL.
 * @route GET /api/kiosk/qrcode/:token
 * @access Private (owner, manager, trainer)
 */
const getKioskQrCode = asyncHandler(async (req, res) => {
  const session = await KioskSession.findOne({
    token: req.params.token,
    company: req.user.company,
  });
  if (!session || session.expiresAt < new Date()) {
    res.status(410);
    throw new Error('This QR session has expired');
  }

  const checkInUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/checkin?token=${session.token}`;
  const qrCode = await QRCode.toBuffer(checkInUrl, { width: 420, margin: 1 });

  res.setHeader('Content-Type', 'image/png');
  res.send(qrCode);
});

/**
 * @desc  Public: checks whether a scanned token is still valid and returns
 *        just enough gym branding to render the member-facing check-in
 *        page. No member data is exposed here.
 * @route GET /api/kiosk/session/:token
 * @access Public
 */
const verifyKioskSession = asyncHandler(async (req, res) => {
  const session = await KioskSession.findOne({ token: req.params.token });
  if (!session || session.expiresAt < new Date()) {
    res.status(410);
    throw new Error('This QR code has expired. Please ask the front desk to refresh it.');
  }

  const company = await Company.findById(session.company).select('name branding');
  res.json({
    success: true,
    data: {
      valid: true,
      company: { name: company?.name, branding: company?.branding },
    },
  });
});

/**
 * @desc  Public: called from the member's own phone after scanning the
 *        kiosk QR. They identify themselves with their phone number or
 *        member code - something they already know, no app/login/card
 *        required - and their attendance is marked instantly.
 * @route POST /api/kiosk/checkin
 * @access Public
 */
const kioskCheckIn = asyncHandler(async (req, res) => {
  const { token, identifier } = req.body;

  if (!token || !identifier || !identifier.trim()) {
    res.status(400);
    throw new Error('Enter your phone number or member code');
  }

  const session = await KioskSession.findOne({ token });
  if (!session || session.expiresAt < new Date()) {
    res.status(410);
    throw new Error('This QR code has expired. Please ask the front desk to refresh it and scan again.');
  }

  const value = identifier.trim();
  const member = await Member.findOne({
    company: session.company,
    $or: [{ phone: value }, { memberCode: value.toUpperCase() }],
  });

  if (!member) {
    res.status(404);
    throw new Error('No member found with that phone number or member code. Check with the front desk.');
  }

  const date = todayStr();
  const existing = await Attendance.findOne({ company: session.company, member: member._id, date });
  if (existing) {
    res.status(409);
    throw new Error(`${member.fullName}, you're already marked present today!`);
  }

  const record = await Attendance.create({
    company: session.company,
    member: member._id,
    date,
    checkInTime: new Date(),
    markedBy: session.createdBy,
    source: 'kiosk',
  });

  res.status(201).json({
    success: true,
    data: record,
    member: { fullName: member.fullName, memberCode: member.memberCode },
  });
});

module.exports = { startKioskSession, getKioskQrCode, verifyKioskSession, kioskCheckIn };