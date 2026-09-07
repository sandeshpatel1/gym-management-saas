const mongoose = require('mongoose');

/**
 * Payment = one revenue transaction, tied to a member and (usually) a plan purchase.
 * Powers the revenue report + PDF export feature.
 */
const paymentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan' },
    invoiceNumber: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank-transfer', 'other'],
      default: 'cash',
    },
    status: { type: String, enum: ['paid', 'refunded', 'pending'], default: 'paid' },
    note: { type: String, trim: true, maxlength: 300 },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

paymentSchema.index({ company: 1, invoiceNumber: 1 }, { unique: true });
paymentSchema.index({ company: 1, paidAt: 1 });
paymentSchema.index({ company: 1, member: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
