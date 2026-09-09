const mongoose = require('mongoose');

/**
 * PlatformSettings = a single global document superadmin edits to control
 * which payment methods exist across the whole platform. Gym owners can
 * only enable methods that appear here (see Company.paymentSettings) — this
 * is how superadmin can roll out (or retire) a payment method for every gym
 * at once, without touching each tenant.
 */
const platformSettingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: 'main', unique: true },
    paymentMethods: [
      {
        key: { type: String, required: true, trim: true, lowercase: true },
        label: { type: String, required: true, trim: true },
        enabled: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

platformSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne({ singleton: 'main' });
  if (!doc) {
    doc = await this.create({
      singleton: 'main',
      paymentMethods: [
        { key: 'cash', label: 'Cash', enabled: true },
        { key: 'card', label: 'Card', enabled: true },
        { key: 'upi', label: 'UPI', enabled: true },
        { key: 'bank-transfer', label: 'Bank Transfer', enabled: true },
        { key: 'other', label: 'Other', enabled: true },
      ],
    });
  }
  return doc;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);