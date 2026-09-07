const mongoose = require('mongoose');

/**
 * Member = a gym-goer (NOT a dashboard login). Registered by staff via the
 * Member Registration form. `memberCode` is a human-friendly ID unique per company.
 */
const membershipHistorySchema = new mongoose.Schema(
  {
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    amountPaid: { type: Number, required: true, min: 0 },
    paymentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  },
  { _id: true, timestamps: true }
);

const memberSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    memberCode: { type: String, required: true, trim: true, uppercase: true },

    // --- Personal details (validated) ---
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[+]?[0-9]{10,15}$/, 'Enter a valid phone number'],
    },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    dob: { type: Date, required: true },
    address: { type: String, trim: true, maxlength: 300 },

    photoUrl: { type: String, default: '' },

    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relation: { type: String, trim: true },
    },

    // --- Health / fitness intake (optional, dynamic) ---
    healthNotes: { type: String, trim: true, maxlength: 500 },
    goals: [{ type: String, trim: true }],

    // --- Membership ---
    currentPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan' },
    membershipStart: { type: Date },
    membershipEnd: { type: Date },
    membershipHistory: [membershipHistorySchema],

    status: {
      type: String,
      enum: ['active', 'expired', 'frozen', 'cancelled'],
      default: 'active',
    },

    assignedTrainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    joinedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// memberCode is unique per company, not globally
memberSchema.index({ company: 1, memberCode: 1 }, { unique: true });
// Search-friendly indexes for the manual member search feature
memberSchema.index({ company: 1, fullName: 'text', phone: 'text', email: 'text' });
memberSchema.index({ company: 1, status: 1 });
memberSchema.index({ company: 1, membershipEnd: 1 });

module.exports = mongoose.model('Member', memberSchema);
