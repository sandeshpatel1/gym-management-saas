const asyncHandler = require('express-async-handler');
const PhotoUploadSession = require('../models/PhotoUploadSession');
const Company = require('../models/Company');

// @route GET /api/photo-sessions/:token  (public — phone verifies the link is live)
const verifyPhotoSession = asyncHandler(async (req, res) => {
  const session = await PhotoUploadSession.findOne({ token: req.params.token });
  if (!session || session.expiresAt < new Date()) {
    res.status(410);
    throw new Error('This QR code has expired. Please ask staff to generate a new one.');
  }
  const company = await Company.findById(session.company).select('name branding');
  res.json({
    success: true,
    data: {
      valid: true,
      status: session.status,
      company: { name: company?.name, branding: company?.branding },
    },
  });
});

// @route POST /api/photo-sessions/:token  (public — phone submits the selfie)
const submitPhotoSession = asyncHandler(async (req, res) => {
  const { photoData } = req.body;
  if (!photoData || !photoData.startsWith('data:image/')) {
    res.status(400);
    throw new Error('A valid photo is required');
  }
  const session = await PhotoUploadSession.findOne({ token: req.params.token });
  if (!session || session.expiresAt < new Date()) {
    res.status(410);
    throw new Error('This QR code has expired. Please ask staff to generate a new one.');
  }
  session.photoData = photoData;
  session.status = 'done';
  await session.save();
  res.json({ success: true, message: 'Photo received' });
});

module.exports = { verifyPhotoSession, submitPhotoSession };