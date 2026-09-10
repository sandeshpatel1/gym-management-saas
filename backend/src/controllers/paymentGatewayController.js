const asyncHandler = require('express-async-handler');
const Company = require('../models/Company');
const Payment = require('../models/Payment');
const Member = require('../models/Member');
const { decrypt } = require('../utils/crypto');
const { getGateway } = require('../services/gateways');
const { computeBilling } = require('../utils/billing');

const loadDecryptedCredentials = (company) => {
  const provider = company.paymentSettings?.gateway?.provider;
  const rawCredentials = company.paymentSettings?.gateway?.credentials || {};
  const credentials = {};
  Object.entries(rawCredentials).forEach(([k, v]) => {
    credentials[k] = decrypt(v);
  });
  return { provider, credentials };
};

/**
 * @desc  Creates a gateway order for a given amount. Frontend uses the
 *        response to open the gateway's checkout (modal) or redirect it.
 * @route POST /api/payments/gateway/create-order
 * @access Private (owner, manager)
 */
const createGatewayOrder = asyncHandler(async (req, res) => {
  const { memberId, amount, description } = req.body;
  if (!memberId || !amount) {
    res.status(400);
    throw new Error('memberId and amount are required');
  }

  const company = await Company.findById(req.user.company);
  const { provider, credentials } = loadDecryptedCredentials(company);
  if (!provider) {
    res.status(400);
    throw new Error('No payment gateway is configured for this gym yet - set it up under Gym Settings');
  }

  const member = await Member.findOne({ _id: memberId, company: req.user.company });
  if (!member) {
    res.status(404);
    throw new Error('Member not found');
  }

  const receipt = `gym-${Date.now()}-${String(member._id).slice(-6)}`;
  const gateway = getGateway(provider);
  const order = await gateway.createOrder(credentials, {
    amount: Number(amount),
    receipt,
    notes: { description: description || 'Gym payment', memberId: String(member._id) },
    customer: { name: member.fullName, email: member.email, phone: member.phone },
  });

  res.status(201).json({ success: true, data: order });
});

/**
 * @desc  Verifies a modal-checkout callback (e.g. Razorpay handler payload)
 *        server-side before recording the Payment, so a forged success
 *        response can't fake a paid invoice.
 * @route POST /api/payments/gateway/verify
 * @access Private (owner, manager)
 */
const verifyGatewayPayment = asyncHandler(async (req, res) => {
  const {
    memberId, planId, orderId, paymentId, signature,
    amount, invoiceAmount, gstRate, discountAmount, dueDate,
  } = req.body;

  const company = await Company.findById(req.user.company);
  const { provider, credentials } = loadDecryptedCredentials(company);
  const gateway = getGateway(provider);

  if (provider === 'razorpay') {
    const valid = gateway.verifyPaymentSignature(credentials, { orderId, paymentId, signature });
    if (!valid) {
      res.status(400);
      throw new Error('Payment verification failed - signature mismatch');
    }
  }

  const invoiceCount = await Payment.countDocuments({ company: req.user.company });
  const billing = computeBilling({ amount, invoiceAmount, gstRate, discountAmount });

  const payment = await Payment.create({
    company: req.user.company,
    member: memberId,
    plan: planId || undefined,
    invoiceNumber: `INV-${String(invoiceCount + 1).padStart(5, '0')}`,
    amount,
    method: provider,
    receivedBy: req.user._id,
    dueDate: billing.amountDue > 0 ? dueDate : undefined,
    note: `Gateway ref: ${paymentId || orderId}`,
    ...billing,
  });

  res.status(201).json({ success: true, data: payment });
});

module.exports = { createGatewayOrder, verifyGatewayPayment };