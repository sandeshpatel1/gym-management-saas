const express = require('express');
const {
  startImpersonation,
  endImpersonation,
  getImpersonationLogs,
} = require('../controllers/impersonationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('superadmin'));

router.post('/:companyId/start', startImpersonation);
router.post('/:companyId/end', endImpersonation);
router.get('/', getImpersonationLogs);

module.exports = router;