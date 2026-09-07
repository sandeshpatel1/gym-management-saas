const asyncHandler = require('express-async-handler');
const PDFDocument = require('pdfkit');
const Payment = require('../models/Payment');
const Company = require('../models/Company');
const { drawInvoice } = require('../utils/invoicePdf');

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
 * it defaults to `amount` (fully paid, no dues, no tax).
 */
const computeBilling = ({ amount, invoiceAmount, gstRate }) => {
  const rate = Number(gstRate || 0);
  const billed = invoiceAmount !== undefined ? Number(invoiceAmount) : Number(amount);
  const taxableAmount = rate > 0 ? +(billed / (1 + rate / 100)).toFixed(2) : billed;
  const taxTotal = +(billed - taxableAmount).toFixed(2);
  const cgstAmount = +(taxTotal / 2).toFixed(2);
  const sgstAmount = +(taxTotal - cgstAmount).toFixed(2);
  const amountDue = Math.max(0, +(billed - Number(amount)).toFixed(2));
  const status = amountDue <= 0 ? 'paid' : Number(amount) > 0 ? 'partial' : 'pending';
  return { taxableAmount, gstRate: rate, cgstAmount, sgstAmount, invoiceAmount: billed, amountDue, status };
};

// @route POST /api/payments  (standalone payment, not tied to registration/renewal flow)
const createPayment = asyncHandler(async (req, res) => {
  const { memberId, planId, amount, method, note, invoiceAmount, gstRate, dueDate } = req.body;
  if (!memberId || amount === undefined) {
    res.status(400);
    throw new Error('memberId and amount are required');
  }
  const invoiceCount = await Payment.countDocuments({ company: req.user.company });
  const billing = computeBilling({ amount, invoiceAmount, gstRate });

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
 * @desc  Download a single payment as a professional GST invoice PDF
 *        (company logo + watermark + GST breakdown + terms).
 * @route GET /api/payments/:id/invoice
 * @access Private
 */
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
  res.setHeader('Content-Disposition', `attachment; filename="${payment.invoiceNumber}.pdf"`);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);
  await drawInvoice(doc, { company, member: payment.member, payment });
  doc.end();
});

/**
 * @desc  Outstanding dues across all members - the Billing page's
 *        "Pending Payments" table.
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

module.exports = { getPayments, createPayment, getPaymentInvoicePdf, getDuesReport };