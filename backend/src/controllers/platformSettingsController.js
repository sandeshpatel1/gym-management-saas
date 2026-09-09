const asyncHandler = require('express-async-handler');
const PlatformSettings = require('../models/PlatformSettings');

/**
 * Fetches the single PlatformSettings document, creating it with defaults
 * on first access if it doesn't exist yet (so you never have to seed it manually).
 */
const getOrCreateSettings = async () => {
  let settings = await PlatformSettings.findOne({ singletonKey: 'platform' });
  if (!settings) {
    settings = await PlatformSettings.create({ singletonKey: 'platform' });
  }
  return settings;
};

/**
 * @desc  List the platform's available payment methods (any logged-in user —
 *        gym owners/managers need this to populate their "enabled methods"
 *        picker in Gym Settings).
 * @route GET /api/platform-settings/payment-methods
 * @access Private (any authenticated user)
 */
const getPlatformPaymentMethods = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json({ success: true, data: settings.paymentMethods });
});

/**
 * @desc  Replace the platform's payment method list (add/remove/rename/
 *        enable/disable options available to every gym).
 * @route PUT /api/platform-settings/payment-methods
 * @access Private (superadmin)
 */
const updatePlatformPaymentMethods = asyncHandler(async (req, res) => {
  const { paymentMethods } = req.body;
  if (!Array.isArray(paymentMethods)) {
    res.status(400);
    throw new Error('paymentMethods must be an array of { key, label, enabled }');
  }

  for (const m of paymentMethods) {
    if (!m.key || !m.label) {
      res.status(400);
      throw new Error('Each payment method needs a key and a label');
    }
  }

  const settings = await getOrCreateSettings();
  settings.paymentMethods = paymentMethods.map((m) => ({
    key: String(m.key).trim().toLowerCase(),
    label: String(m.label).trim(),
    enabled: m.enabled !== false,
  }));
  await settings.save();

  res.json({ success: true, data: settings.paymentMethods });
});

module.exports = { getPlatformPaymentMethods, updatePlatformPaymentMethods };