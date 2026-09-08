const mongoose = require('mongoose');

/**
 * MembershipExtension = an audit trail entry for manual "add N days" grants,
 * separate from a real renewal (which requires a plan + payment).
 */
const membershipExtensionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    daysAdded: { type: Number, required: true, min: 1 },
    previousEnd: { type: Date },
    newEnd: { type: Date, required: true },
    reason: { type: String, trim: true, maxlength: 300 },
    extendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

membershipExtensionSchema.index({ company: 1, member: 1, createdAt: -1 });

module.exports = mongoose.model('MembershipExtension', membershipExtensionSchema);