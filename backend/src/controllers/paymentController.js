const asyncHandler = require('express-async-handler');
const PDFDocument = require('pdfkit');
const Payment = require('../models/Payment');
const Company = require('../models/Company');
const { drawInvoice } = require('../utils/invoicePdf');
const { computeBilling } = require('../utils/billing');

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

/**
 * Works out the GST split + dues for a payment being created. `invoiceAmount`
 * is what's actually billed (taxable + tax); if the caller doesn't send it,
 * it defaults to `amount` (fully paid, no dues, no tax). `discountAmount`
 * reduces the billed total before dues are computed.
 */

// @route POST /api/payments  (standalone payment, not tied to registration/renewal flow)
const createPayment = asyncHandler(async (req, res) => {
  const {
    memberId,
    planId,
    amount,
    method,
    note,
    invoiceAmount,
    gstRate,
    discountAmount,
    dueDate,
  } = req.body;
  if (!memberId || amount === undefined) {
    res.status(400);
    throw new Error('memberId and amount are required');
  }
  const invoiceCount = await Payment.countDocuments({ company: req.user.company });
  const billing = computeBilling({ amount, invoiceAmount, gstRate, discountAmount });

  const payment = await Payment.create({
    company: req.user.company,
    member: memberId,
    plan: planId,
    invoiceNumber: `INV-${String(invoiceCount + 1).padStart(5, '0')}`,
    amount,
    method,
    note,
    receivedBy: req.user._id,
    dueDate,
    ...billing,
  });
  res.status(201).json({ success: true, data: payment });
});

/**
 * @desc  Record an additional payment against an invoice that still has
 *        an outstanding due (partial-payment collection). Never exceeds
 *        the remaining amountDue.
 * @route POST /api/payments/:id/collect
 * @access Private (owner, manager)
 */
const collectDue = asyncHandler(async (req, res) => {
  const { amount, method } = req.body;
  const amt = Number(amount);
  if (!amt || amt <= 0) {
    res.status(400);
    throw new Error('Enter a valid amount');
  }

  const payment = await Payment.findOne({ _id: req.params.id, company: req.user.company });
  if (!payment) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  if (payment.amountDue <= 0) {
    res.status(400);
    throw new Error('This invoice has no outstanding due');
  }
  if (amt > payment.amountDue + 0.01) {
    res.status(400);
    throw new Error(`Amount exceeds outstanding due of Rs. ${payment.amountDue.toFixed(2)}`);
  }

  payment.amount = +(payment.amount + amt).toFixed(2);
  payment.amountDue = Math.max(0, +(payment.amountDue - amt).toFixed(2));
  payment.status = payment.amountDue <= 0 ? 'paid' : 'partial';
  if (method) payment.method = method;
  await payment.save();

  const populated = await payment.populate([
    { path: 'member', select: 'fullName memberCode phone' },
    { path: 'plan', select: 'name' },
  ]);

  res.json({ success: true, data: populated });
});

/**
 * @desc  Refund a payment (full or partial). Sets status to 'refunded' and
 *        records who/why/when — separate from amountDue, which tracks
 *        money still owed TO the gym, not money owed BACK to the member.
 * @route POST /api/payments/:id/refund
 * @access Private (owner)
 */
const refundPayment = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  const payment = await Payment.findOne({ _id: req.params.id, company: req.user.company });
  if (!payment) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  const amt = amount !== undefined ? Number(amount) : payment.amount;
  if (!amt || amt <= 0 || amt > payment.amount + 0.01) {
    res.status(400);
    throw new Error('Enter a valid refund amount (up to the amount received)');
  }

  payment.status = 'refunded';
  payment.refund = {
    amount: amt,
    reason: reason || '',
    refundedAt: new Date(),
    refundedBy: req.user._id,
  };
  await payment.save();

  const populated = await payment.populate([
    { path: 'member', select: 'fullName memberCode phone' },
    { path: 'plan', select: 'name' },
  ]);

  res.json({ success: true, data: populated });
});

/**
 * @desc  Marks that a reminder was sent for this due (bumps a counter/
 *        timestamp so staff can see it was already followed up on).
 *        The actual message is composed client-side (WhatsApp/SMS link) —
 *        this just logs that it happened.
 * @route POST /api/payments/:id/remind
 * @access Private (owner, manager)
 */
const logReminder = asyncHandler(async (req, res) => {
  const payment = await Payment.findOneAndUpdate(
    { _id: req.params.id, company: req.user.company },
    { $inc: { reminderCount: 1 }, $set: { lastReminderAt: new Date() } },
    { new: true }
  );
  if (!payment) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  res.json({ success: true, data: payment });
});

// @route GET /api/payments/:id/invoice
const getPaymentInvoicePdf = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ _id: req.params.id, company: req.user.company })
    .populate('member', 'fullName memberCode phone email')
    .populate('plan', 'name');
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }
  const company = await Company.findById(req.user.company);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${payment.invoiceNumber}.pdf"`);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);
  await drawInvoice(doc, { company, member: payment.member, payment });
  doc.end();
});

/**
 * @desc  Outstanding dues across all members, sorted by most overdue first —
 *        the Billing page's "Pending Payments" table.
 * @route GET /api/payments/dues
 * @access Private
 */
const getDuesReport = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ company: req.user.company, amountDue: { $gt: 0 } })
    .populate('member', 'fullName memberCode phone')
    .populate('plan', 'name')
    .sort({ dueDate: 1, paidAt: -1 });

  const totalDue = payments.reduce((sum, p) => sum + p.amountDue, 0);
  res.json({ success: true, count: payments.length, totalDue, data: payments });
});

module.exports = {
  getPayments,
  createPayment,
  collectDue,
  refundPayment,
  logReminder,
  getPaymentInvoicePdf,
  getDuesReport,
};