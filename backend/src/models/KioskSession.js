const mongoose = require('mongoose');

/**
 * KioskSession = a short-lived, rotating token behind the attendance kiosk
 * QR code. The kiosk (a laptop/tablet at the front desk) displays a QR that
 * encodes a check-in URL containing this token. Members scan it with their
 * own phone camera - nothing to carry, nothing to lose. The token expires
 * quickly (see TOKEN_LIFETIME_SECONDS in the controller) and the kiosk
 * screen keeps requesting a new one, so a photo of the screen taken from
 * outside the gym stops working within seconds.
 */
const kioskSessionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    token: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index: MongoDB removes the document once expiresAt has passed (the
// background sweep runs roughly every 60s, so every place a token is
// validated also double-checks expiresAt manually for correctness).
kioskSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('KioskSession', kioskSessionSchema);