const crypto = require('crypto');

// NOTE: verify this field order against Easebuzz's CURRENT API docs before
// going live - gateway hash specs change between API versions and a wrong
// field order fails silently (hash mismatch, not an explicit error).
const sha512 = (str) => crypto.createHash('sha512').update(str).digest('hex');

const createOrder = async (credentials, { amount, receipt, notes, customer }) => {
  const key = credentials.merchantKey;
  const salt = credentials.salt;
  const txnid = receipt;
  const productinfo = notes?.description || 'Gym Payment';
  const firstname = customer?.name || 'Member';
  const email = customer?.email || 'member@example.com';

  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
  const hash = sha512(hashString);

  // In production this posts to Easebuzz's initiate-payment endpoint and
  // returns their hosted access_key/redirect URL. Left as the integration
  // point since testing it requires a live Easebuzz sandbox account.
  return {
    provider: 'easebuzz',
    checkoutType: 'redirect',
    txnid,
    amount,
    hash,
    redirectUrl: null, // populate once wired to Easebuzz's /payment/initiateLink API
  };
};

const verifyResponseHash = (credentials, payload) => {
  const { status, key, txnid, amount, productinfo, firstname, email, hash } = payload;
  const salt = credentials.salt;
  const expected = sha512(
    `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`
  );
  return expected === hash;
};

module.exports = { createOrder, verifyResponseHash };