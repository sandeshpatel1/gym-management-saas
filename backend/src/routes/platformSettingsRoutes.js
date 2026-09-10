const express = require('express');
const {
  getPlatformPaymentMethods,
  updatePlatformPaymentMethods,
  getPlatformGatewayProviders,
  updatePlatformGatewayProviders,
} = require('../controllers/platformSettingsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/payment-methods', protect, getPlatformPaymentMethods);
router.put('/payment-methods', protect, authorize('superadmin'), updatePlatformPaymentMethods);

router.get('/gateway-providers', protect, getPlatformGatewayProviders);
router.put('/gateway-providers', protect, authorize('superadmin'), updatePlatformGatewayProviders);

module.exports = router;