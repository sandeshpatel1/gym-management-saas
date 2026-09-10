const Razorpay = require('razorpay');
const crypto = require('crypto');

/**
 * Creates a Razorpay order server-side. Frontend gets back the orderId +
 * public keyId and opens Razorpay's checkout modal with it - the secret
 * key never reaches the browser.
 */
const createOrder = async (credentials, { amount, currency = 'INR', receipt, notes }) => {
  const instance = new Razorpay({ key_id: credentials.keyId, key_secret: credentials.keySecret });
  const order = await instance.orders.create({
    amount: Math.round(Number(amount) * 100), // Razorpay expects paise
    currency,
    receipt,
    notes,
  });
  return {
    provider: 'razorpay',
    checkoutType: 'modal',
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: credentials.keyId, // public, safe to expose
  };
};

// Verifies the signature Razorpay's checkout.js hands back on success -
// this is what proves the payment is real and wasn't forged client-side.
const verifyPaymentSignature = (credentials, { orderId, paymentId, signature }) => {
  const expected = crypto
    .createHmac('sha256', credentials.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
};

// For server-to-server webhooks (recommended in addition to client verify,
// since a browser can be closed before the handler fires).
const verifyWebhookSignature = (credentials, rawBody, signatureHeader) => {
  if (!credentials.webhookSecret) return false;
  const expected = crypto.createHmac('sha256', credentials.webhookSecret).update(rawBody).digest('hex');
  return expected === signatureHeader;
};

module.exports = { createOrder, verifyPaymentSignature, verifyWebhookSignature };