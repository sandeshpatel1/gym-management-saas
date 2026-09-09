const express = require('express');
const {
  getCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  setCompanyStatus,
  getUpiQrPreview,
} = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Company Master list/create - platform superadmin only
router.get('/', protect, authorize('superadmin'), getCompanies);
router.post('/', protect, authorize('superadmin'), createCompany);

// Read/update a single company - superadmin OR that company's own owner (branding/settings)
router.get('/:id', protect, getCompanyById);
router.put('/:id', protect, authorize('superadmin', 'owner'), updateCompany);
router.patch('/:id/status', protect, authorize('superadmin'), setCompanyStatus);
router.get('/:id/upi-qr', protect, getUpiQrPreview);

module.exports = router;