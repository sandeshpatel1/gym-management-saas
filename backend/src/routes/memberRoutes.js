const express = require('express');
const {
  createMember,
  getMembers,
  searchMembers,
  getMemberById,
  updateMember,
  renewMembership,
  getMemberQrCode,
  extendMembership,
  getMemberExtensions,
  createPhotoSession,
  getPhotoSessionResult,
  getPhotoSessionQr,
} = require('../controllers/memberController');
const { protect, authorize, requireCompanyScope } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireCompanyScope);

router.get('/search', searchMembers); // manual member search / autocomplete
router.get('/', getMembers);
router.post('/', authorize('owner', 'manager'), createMember);

// Photo handoff (QR-scan selfie flow) — owner/manager only
router.post('/:id/photo-session', authorize('owner', 'manager'), createPhotoSession);
router.get('/photo-session/:token', authorize('owner', 'manager'), getPhotoSessionResult);
router.get('/photo-session/:token/qrcode', authorize('owner', 'manager'), getPhotoSessionQr);

// Manual membership extension — owner/manager only
router.post('/:id/extend-membership', authorize('owner', 'manager'), extendMembership);
router.get('/:id/extensions', getMemberExtensions);

router.get('/:id', getMemberById); // member report card data
router.get('/:id/qrcode', getMemberQrCode); // printable check-in QR
router.put('/:id', authorize('owner', 'manager'), updateMember);
router.post('/:id/renew', authorize('owner', 'manager'), renewMembership);

module.exports = router;