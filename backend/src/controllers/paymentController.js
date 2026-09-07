const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');

// @route GET /api/payments
const getPayments = asyncHandler(async (req, res) => {
  const { from, to, page = 1, limit = 20 } = req.query;
  const filter = { company: req.user.company };
  if (from || to) {
    filter.paidAt = {};
    if (from) filter.paidAt.$gte = new Date(from);
    if (to) filter.paidAt.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('member', 'fullName memberCode phone')
      .populate('plan', 'name')
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: payments,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  });
});

// @route POST /api/payments  (standalone payment, not tied to registration/renewal flow)
const createPayment = asyncHandler(async (req, res) => {
  const { memberId, planId, amount, method, note } = req.body;
  if (!memberId || amount === undefined) {
    res.status(400);
    throw new Error('memberId and amount are required');
  }
  const invoiceCount = await Payment.countDocuments({ company: req.user.company });
  const payment = await Payment.create({
    company: req.user.company,
    member: memberId,
    plan: planId,
    invoiceNumber: `INV-${String(invoiceCount + 1).padStart(5, '0')}`,
    amount,
    method,
    note,
    receivedBy: req.user._id,
  });
  res.status(201).json({ success: true, data: payment });
});

module.exports = { getPayments, createPayment };
