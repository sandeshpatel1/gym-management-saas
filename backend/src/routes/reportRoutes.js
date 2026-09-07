const express = require('express');
const {
  getPlatformStats,
  getDashboardStats,
  getRevenueReport,
  exportRevenuePdf,
  exportMemberReportCard,
} = require('../controllers/reportController');
const { protect, authorize, requireCompanyScope } = require('../middleware/auth');

const router = express.Router();

// Platform-wide overview for the superadmin dashboard - NOT scoped to a
// company (superadmin has none), so this is registered before the
// requireCompanyScope middleware below.
router.get('/platform', protect, authorize('superadmin'), getPlatformStats);

router.use(protect, requireCompanyScope);

router.get('/dashboard', getDashboardStats);
router.get('/revenue', getRevenueReport);
router.get('/revenue/export', exportRevenuePdf);
router.get('/member/:id/export', exportMemberReportCard);

module.exports = router;