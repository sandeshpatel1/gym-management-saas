const crypto = require('crypto');

/**
 * Signs a member id into a compact, tamper-proof QR payload:
 *   "<memberId>.<companyId>.<hmac>"
 * so a scanned QR can't be forged to check in a different member.
 */
const sign = (memberId, companyId) => {
  const payload = `${memberId}.${companyId}`;
  const hmac = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 24); // short enough to keep the QR code dense-but-scannable
  return `${payload}.${hmac}`;
};

const verify = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [memberId, companyId, hmac] = parts;
  const expected = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(`${memberId}.${companyId}`)
    .digest('hex')
    .slice(0, 24);
  if (hmac !== expected) return null;
  return { memberId, companyId };
};

module.exports = { sign, verify };