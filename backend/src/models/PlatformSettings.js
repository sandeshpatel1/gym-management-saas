const mongoose = require('mongoose');

/**
 * PlatformSettings = a single global document superadmin edits to control:
 *  - which basic payment METHODS exist (cash/card/upi/etc, already used by
 *    the Billing "collect" flow)
 *  - which payment GATEWAY PROVIDERS (Razorpay, Easebuzz, ...) gym owners
 *    are allowed to plug their own credentials into. Each provider declares
 *    its own credential `fields`, so adding a new gateway is just adding an
 *    entry here - no schema migration or frontend redeploy needed.
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
    gatewayProviders: [
      {
        key: { type: String, required: true, trim: true, lowercase: true },
        label: { type: String, required: true, trim: true },
        // 'modal' = provider's JS SDK opens an in-page checkout (Razorpay).
        // 'redirect' = owner's app redirects to a hosted payment page (Easebuzz-style).
        checkoutType: { type: String, enum: ['modal', 'redirect'], default: 'modal' },
        fields: [
          {
            name: { type: String, required: true },  // e.g. "keyId"
            label: { type: String, required: true },  // e.g. "Key ID"
            secret: { type: Boolean, default: false }, // masked in UI + encrypted at rest
          },
        ],
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
      gatewayProviders: [
        {
          key: 'razorpay',
          label: 'Razorpay',
          checkoutType: 'modal',
          enabled: true,
          fields: [
            { name: 'keyId', label: 'Key ID', secret: false },
            { name: 'keySecret', label: 'Key Secret', secret: true },
            { name: 'webhookSecret', label: 'Webhook Secret (optional)', secret: true },
          ],
        },
        {
          key: 'easebuzz',
          label: 'Easebuzz',
          checkoutType: 'redirect',
          enabled: true,
          fields: [
            { name: 'merchantKey', label: 'Merchant Key', secret: false },
            { name: 'salt', label: 'Salt', secret: true },
          ],
        },
      ],
    });
  }
  return doc;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);