const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  startKioskSession,
  getKioskQrCode,
  verifyKioskSession,
  kioskCheckIn,
} = require('../controllers/kioskController');
const { protect, authorize, requireCompanyScope } = require('../middleware/auth');

const router = express.Router();

// Public check-in is unauthenticated and hit from members' own phones, so
// guard against brute-forcing phone numbers / member codes.
const checkInLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please wait a moment and try again.' },
});

// --- Public (member's own phone, no login) ---
router.get('/session/:token', verifyKioskSession);
router.post('/checkin', checkInLimiter, kioskCheckIn);

// --- Staff-only (the kiosk display itself) ---
router.post('/session', protect, requireCompanyScope, authorize('owner', 'manager', 'trainer'), startKioskSession);
router.get('/qrcode/:token', protect, requireCompanyScope, authorize('owner', 'manager', 'trainer'), getKioskQrCode);

module.exports = router;