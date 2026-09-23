const express = require('express');

const {
  getCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  setCompanyStatus,
  updateSubscription,
  getExpiringCompanies,
  getUpiQrPreview,
  getGatewaySettings,
  updateGatewaySettings,
  getMyBranches,
  createBranchForOwner,
  removeBranch,
} = require('../controllers/companyController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Branch access (owner multi-location) + subscription renewals list -
// registered before the `/:id` routes below so these literal paths are
// never mistaken for an id.
router.get('/my-branches', protect, getMyBranches);
router.post('/branches', protect, authorize('superadmin'), createBranchForOwner);
router.delete('/branches/:id', protect, authorize('owner'), removeBranch);
router.get('/expiring', protect, authorize('superadmin'), getExpiringCompanies);

// Company Master list/create - platform superadmin only
router.get('/', protect, authorize('superadmin'), getCompanies);
router.post('/', protect, authorize('superadmin'), createCompany);

// Read/update a single company - superadmin OR that company's own owner
router.get('/:id', protect, getCompanyById);
router.put('/:id', protect, authorize('superadmin', 'owner'), updateCompany);
router.patch('/:id/status', protect, authorize('superadmin'), setCompanyStatus);
router.put('/:id/subscription', protect, authorize('superadmin'), updateSubscription);

router.get('/:id/upi-qr', protect, getUpiQrPreview);

// Payment gateway settings
router.get('/:id/gateway-settings', protect, getGatewaySettings);
router.put('/:id/gateway-settings', protect, updateGatewaySettings);

module.exports = router;