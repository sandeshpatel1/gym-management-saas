const mongoose = require('mongoose');

/**
 * PhotoUploadSession = short-lived, single-use handoff token behind the
 * "scan QR, take a selfie on your phone" flow on the member edit page.
 * Same pattern as KioskSession: a token the phone submits to, that the
 * desktop polls for. TTL-indexed so it self-cleans after expiry.
 */
const photoUploadSessionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'done'], default: 'pending' },
    photoData: { type: String }, // base64 data URI once the phone submits it
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

photoUploadSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PhotoUploadSession', photoUploadSessionSchema);