const Company = require('../models/Company');

/**
 * A subscription is "expired" purely by date: validTill has passed. This
 * is the single source of truth checked everywhere (login, Company
 * Master, platform dashboard, renewals list) so a gym that quietly
 * passed its date is treated consistently no matter where it's read.
 */
const isExpired = (company) =>
  Boolean(company?.subscription?.validTill && company.subscription.validTill < new Date());

/**
 * Lazily settles any subscription whose validTill has passed: downgrades
 * plan to 'trial' and marks status 'expired', in one bulk write. There's
 * no cron job running, so this is called at the top of every read path
 * that shows subscription state (login, company list, dashboard, the
 * expiring-soon report) instead.
 * `filter` optionally narrows which companies to settle (e.g. one company
 * id at login) - omit it to settle the whole platform.
 */
const settleExpiredSubscriptions = async (filter = {}) => {
  await Company.updateMany(
    {
      ...filter,
      'subscription.validTill': { $lt: new Date() },
      'subscription.status': { $ne: 'expired' },
    },
    { $set: { 'subscription.status': 'expired', 'subscription.plan': 'trial' } }
  );
};

module.exports = { isExpired, settleExpiredSubscriptions };