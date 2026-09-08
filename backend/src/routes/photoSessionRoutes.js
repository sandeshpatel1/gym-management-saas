const express = require('express');
const rateLimit = require('express-rate-limit');
const { verifyPhotoSession, submitPhotoSession } = require('../controllers/photoSessionController');

const router = express.Router();

// Public + unauthenticated (hit from the member/staff's own phone) — guard against abuse.
const submitLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please wait a moment and try again.' },
});

router.get('/:token', verifyPhotoSession);
// Selfies are base64 JSON, larger than the app-wide 2mb limit — bump it just for this route.
router.post('/:token', submitLimiter, express.json({ limit: '6mb' }), submitPhotoSession);

module.exports = router;