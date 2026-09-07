const express = require('express');
const {
  getPayments,
  createPayment,
  getPaymentInvoicePdf,
  getDuesReport,
} = require('../controllers/paymentController');
const { protect, authorize, requireCompanyScope } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireCompanyScope);

router.get('/dues', authorize('owner', 'manager'), getDuesReport);
router.get('/', getPayments);
router.post('/', authorize('owner', 'manager'), createPayment);
router.get('/:id/invoice', getPaymentInvoicePdf);

module.exports = router;