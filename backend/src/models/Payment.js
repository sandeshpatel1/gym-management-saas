const mongoose = require('mongoose');

/**
 * Payment = one revenue transaction, tied to a member and (usually) a plan purchase.
 * Powers the revenue report + PDF invoice export.
 *
 * `amount` keeps its original meaning: money actually received (so existing
 * revenue aggregations that sum `amount` are unaffected). `invoiceAmount` is
 * what was actually billed; when it's not supplied it defaults to `amount`,
 * so old callers (member registration, renewal) keep working with zero dues.
 */
const paymentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan' },
    invoiceNumber: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 }, // amount actually received
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank-transfer', 'other'],
      default: 'cash',
    },
    note: { type: String, trim: true, maxlength: 300 },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    paidAt: { type: Date, default: Date.now },

    // --- GST / billing ---
    invoiceAmount: { type: Number, min: 0 }, // total billed (taxable + tax); defaults to `amount`
    taxableAmount: { type: Number, min: 0 },
    gstRate: { type: Number, default: 0 }, // percent, e.g. 18
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    dueDate: { type: Date },
    status: { type: String, enum: ['paid', 'partial', 'pending', 'refunded'], default: 'paid' },
  },
  { timestamps: true }
);

paymentSchema.pre('validate', function (next) {
  if (this.invoiceAmount === undefined || this.invoiceAmount === null) {
    this.invoiceAmount = this.amount;
  }
  if (this.taxableAmount === undefined || this.taxableAmount === null) {
    const rate = this.gstRate || 0;
    this.taxableAmount = rate > 0 ? +(this.invoiceAmount / (1 + rate / 100)).toFixed(2) : this.invoiceAmount;
  }
  if (this.amountDue === undefined || this.amountDue === null) {
    this.amountDue = Math.max(0, +(this.invoiceAmount - this.amount).toFixed(2));
  }
  if (!this.isModified('status') || !this.status) {
    this.status = this.amountDue <= 0 ? 'paid' : this.amount > 0 ? 'partial' : 'pending';
  }
  next();
});

paymentSchema.index({ company: 1, invoiceNumber: 1 }, { unique: true });
paymentSchema.index({ company: 1, paidAt: 1 });
paymentSchema.index({ company: 1, member: 1 });
paymentSchema.index({ company: 1, amountDue: 1 });

module.exports = mongoose.model('Payment', paymentSchema);