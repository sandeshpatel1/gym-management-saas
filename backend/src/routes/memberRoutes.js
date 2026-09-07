const express = require('express');
const {
  createMember,
  getMembers,
  searchMembers,
  getMemberById,
  updateMember,
  renewMembership,
  getMemberQrCode,
} = require('../controllers/memberController');
const { protect, authorize, requireCompanyScope } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireCompanyScope);

router.get('/search', searchMembers); // manual member search feature
router.get('/', getMembers);
router.post('/', authorize('owner', 'manager'), createMember);
router.get('/:id', getMemberById); // member report card data
router.get('/:id/qrcode', getMemberQrCode); // printable check-in QR
router.put('/:id', authorize('owner', 'manager'), updateMember);
router.post('/:id/renew', authorize('owner', 'manager'), renewMembership);

module.exports = router;