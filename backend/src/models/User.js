const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User = anyone who LOGS IN to the dashboard (staff), not a gym member.
 * - role 'superadmin': platform owner, not tied to a single company, manages Company Master.
 * - role 'owner': gym owner/admin for their company (their "home" branch).
 * - role 'manager': front-desk / manager, scoped operational access.
 * - role 'trainer': trainer, limited to attendance + assigned members.
 *
 * `company` is null only for superadmin. Every other role MUST have a company,
 * enforced in the pre-validate hook below.
 *
 * `branchAccess` = ADDITIONAL companies (branches) an OWNER can switch into
 * from the same login, on top of their home `company`. Managers/trainers
 * don't use this field - they stay scoped to their one company. See
 * middleware/auth.js `requireCompanyScope` for how the active branch is
 * resolved per-request, and BranchSwitcher.jsx for the UI.
 */
const userSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    branchAccess: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email'],
    },
    phone: { type: String, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ['superadmin', 'owner', 'manager', 'trainer'],
      default: 'manager',
    },
    avatarUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('validate', function (next) {
  if (this.role !== 'superadmin' && !this.company) {
    return next(new Error('company is required for non-superadmin users'));
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ company: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);