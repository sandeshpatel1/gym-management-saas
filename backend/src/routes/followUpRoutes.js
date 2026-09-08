const express = require('express');
const {
  getFollowUpSummary,
  getFollowUpList,
  createFollowUp,
  getMemberFollowUps,
} = require('../controllers/followUpController');
const { protect, authorize, requireCompanyScope } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireCompanyScope);

router.get('/summary', getFollowUpSummary);
router.get('/', getFollowUpList);
router.post('/', authorize('owner', 'manager', 'trainer'), createFollowUp);
router.get('/member/:memberId', getMemberFollowUps);

module.exports = router;