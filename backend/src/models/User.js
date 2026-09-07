const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User = anyone who LOGS IN to the dashboard (staff), not a gym member.
 * - role 'superadmin': platform owner, not tied to a single company, manages Company Master.
 * - role 'owner': gym owner/admin for their company.
 * - role 'manager': front-desk / manager, scoped operational access.
 * - role 'trainer': trainer, limited to attendance + assigned members.
 *
 * `company` is null only for superadmin. Every other role MUST have a company,
 * enforced in the pre-validate hook below.
 */
const userSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
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
