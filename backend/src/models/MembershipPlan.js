const mongoose = require('mongoose');

/**
 * MembershipPlan = a dynamic plan each gym (company) defines for itself,
 * e.g. "3-Month Cardio", "Annual Unlimited", "Personal Training - 12 sessions".
 * Fully tenant-defined: no hardcoded plan list.
 */
const membershipPlanSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500 },
    durationInDays: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    // Optional structured perks so the frontend can render a feature checklist dynamically
    features: [{ type: String, trim: true }],
    category: {
      type: String,
      enum: ['general', 'cardio', 'strength', 'personal-training', 'group-class', 'other'],
      default: 'general',
    },
    maxSessionsPerWeek: { type: Number, default: 0 }, // 0 = unlimited
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

membershipPlanSchema.index({ company: 1, isActive: 1 });

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
