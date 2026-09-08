const mongoose = require('mongoose');

/**
 * FollowUp = a logged call/contact attempt against a member who needs
 * attention: hasn't visited in 7+ days (active membership), has an
 * inactive/expired membership, or is a trial/enquiry visitor who never
 * bought a plan. Multiple entries can exist per member over time so staff
 * can see the full contact history, not just the latest note.
 */
const followUpSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    type: { type: String, enum: ['absent', 'inactive', 'trial'], required: true },
    reason: { type: String, trim: true, maxlength: 500, required: true }, // outcome/conclusion of the call
    calledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    calledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

followUpSchema.index({ company: 1, member: 1, createdAt: -1 });
followUpSchema.index({ company: 1, type: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);