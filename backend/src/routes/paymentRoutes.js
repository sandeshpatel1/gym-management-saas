const express = require('express');
const {
  getPayments,
  createPayment,
  collectDue,
  refundPayment,
  logReminder,
  getPaymentInvoicePdf,
  getDuesReport,
} = require('../controllers/paymentController');
const { protect, authorize, requireCompanyScope } = require('../middleware/auth');
const { createGatewayOrder, verifyGatewayPayment } = require('../controllers/paymentGatewayController'); // add to imports
const router = express.Router();

router.use(protect, requireCompanyScope);

router.get('/dues', authorize('owner', 'manager'), getDuesReport);
router.get('/', getPayments);
router.post('/', authorize('owner', 'manager'), createPayment);
router.post('/:id/collect', authorize('owner', 'manager'), collectDue);
router.post('/:id/refund', authorize('owner'), refundPayment);
router.post('/:id/remind', authorize('owner', 'manager'), logReminder);
router.get('/:id/invoice', getPaymentInvoicePdf);

router.post('/gateway/create-order', authorize('owner', 'manager'), createGatewayOrder);
router.post('/gateway/verify', authorize('owner', 'manager'), verifyGatewayPayment);

module.exports = router;