const express = require('express');
const { getPayments, createPayment } = require('../controllers/paymentController');
const { protect, authorize, requireCompanyScope } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireCompanyScope);

router.get('/', getPayments);
router.post('/', authorize('owner', 'manager'), createPayment);

module.exports = router;
