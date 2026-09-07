/**
 * Run once: npm run seed:superadmin
 * Creates the platform superadmin account that manages the Company Master
 * (onboarding new gyms). Reads SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD from .env
 */
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  await connectDB();

  const email = (process.env.SUPERADMIN_EMAIL || 'superadmin@gymsaas.com').toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD || 'ChangeMe123!';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Superadmin already exists: ${email}`);
    process.exit(0);
  }

  await User.create({
    name: 'Platform Superadmin',
    email,
    password,
    role: 'superadmin',
    company: null,
  });

  console.log(`Superadmin created: ${email} (password from .env - change it after first login)`);
  process.exit(0);
})();
