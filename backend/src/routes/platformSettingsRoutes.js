const express = require('express');
const {
  getPlatformPaymentMethods,
  updatePlatformPaymentMethods,
} = require('../controllers/platformSettingsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/payment-methods', protect, getPlatformPaymentMethods);
router.put('/payment-methods', protect, authorize('superadmin'), updatePlatformPaymentMethods);

module.exports = router;