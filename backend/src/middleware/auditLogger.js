const ImpersonationLog = require('../models/ImpersonationLog');

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Never written to the log, even redacted - checked case-insensitively
// against key names at any depth of the request body.
const SENSITIVE_KEYS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'keysecret',
  'webhooksecret',
  'salt',
  'merchantkey',
  'credentials',
  'signature',
  'apikey',
]);

const redact = (value, depth = 0) => {
  if (depth > 4 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '[redacted]' : redact(val, depth + 1);
  }
  return out;
};

// Superadmin's OWN platform-admin actions (Company Master itself - create
// gym, edit gym, activate/deactivate, renew subscription) are not
// impersonation and shouldn't be logged as "acting inside a gym".
const isCompanyAdminRoute = (originalUrl) => /^\/api\/companies(\/|$|\?)/.test(originalUrl);

/**
 * Logs every write a superadmin makes while managing a gym. Mounted
 * globally, early in server.js, so it sees every request regardless of
 * which router handled it. It inspects req.user and the `company` query
 * param (which axiosClient auto-attaches to every request while a gym is
 * being managed) at response time, once the whole middleware chain -
 * including auth - has already run against the same req object.
 * Fire-and-forget: never blocks or fails the actual request.
 */
const auditWriteActions = (req, res, next) => {
  res.on('finish', () => {
    if (!WRITE_METHODS.includes(req.method)) return;
    if (!req.user || req.user.role !== 'superadmin') return;
    if (isCompanyAdminRoute(req.originalUrl)) return;

    const companyId = req.query?.company || req.headers['x-company-id'];
    if (!companyId) return; // not currently managing a gym

    ImpersonationLog.create({
      superadmin: req.user._id,
      superadminName: req.user.name,
      company: companyId,
      companyName: req.impersonatedCompanyName || undefined,
      action: 'write',
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      body: redact(req.body),
    }).catch((err) => {
      console.error('Failed to write impersonation audit log:', err.message);
    });
  });
  next();
};

module.exports = { auditWriteActions, redact };