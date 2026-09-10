const asyncHandler = require('express-async-handler');
const PlatformSettings = require('../models/PlatformSettings');

// @route GET /api/platform-settings/payment-methods
const getPlatformPaymentMethods = asyncHandler(async (req, res) => {
  const settings = await PlatformSettings.getSingleton();
  res.json({ success: true, data: settings.paymentMethods });
});

// @route PUT /api/platform-settings/payment-methods (superadmin only)
const updatePlatformPaymentMethods = asyncHandler(async (req, res) => {
  const { paymentMethods } = req.body;
  if (!Array.isArray(paymentMethods) || paymentMethods.some((m) => !m.key)) {
    res.status(400);
    throw new Error('paymentMethods must be an array of { key, label, enabled }');
  }
  const settings = await PlatformSettings.getSingleton();
  settings.paymentMethods = paymentMethods.map((m) => ({
    key: String(m.key).trim().toLowerCase(),
    label: m.label?.trim() || m.key,
    enabled: !!m.enabled,
  }));
  await settings.save();
  res.json({ success: true, data: settings.paymentMethods });
});

// @route GET /api/platform-settings/gateway-providers
const getPlatformGatewayProviders = asyncHandler(async (req, res) => {
  const settings = await PlatformSettings.getSingleton();
  res.json({ success: true, data: settings.gatewayProviders });
});

// @route PUT /api/platform-settings/gateway-providers (superadmin only)
const updatePlatformGatewayProviders = asyncHandler(async (req, res) => {
  const { gatewayProviders } = req.body;
  if (!Array.isArray(gatewayProviders) || gatewayProviders.some((g) => !g.key || !Array.isArray(g.fields))) {
    res.status(400);
    throw new Error('gatewayProviders must be an array of { key, label, fields[], enabled }');
  }
  const settings = await PlatformSettings.getSingleton();
  settings.gatewayProviders = gatewayProviders.map((g) => ({
    key: String(g.key).trim().toLowerCase(),
    label: g.label?.trim() || g.key,
    checkoutType: g.checkoutType === 'redirect' ? 'redirect' : 'modal',
    fields: (g.fields || []).map((f) => ({
      name: f.name?.trim(),
      label: f.label?.trim() || f.name,
      secret: !!f.secret,
    })),
    enabled: !!g.enabled,
  }));
  await settings.save();
  res.json({ success: true, data: settings.gatewayProviders });
});

module.exports = {
  getPlatformPaymentMethods,
  updatePlatformPaymentMethods,
  getPlatformGatewayProviders,
  updatePlatformGatewayProviders,
};