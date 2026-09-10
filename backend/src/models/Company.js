const mongoose = require('mongoose');

/**
 * Company = a tenant (one physical/branded gym business).
 * Every other collection (User, Member, MembershipPlan, Attendance, Payment)
 * carries a `company` field referencing this, and every query in every
 * controller MUST be scoped by req.user.company (see middleware/auth.js).
 */
const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: 120,
    },
    // Unique short code members/staff can use to identify the gym (e.g. on reports, invoices)
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 12,
    },
    // Dynamic branding shown across the dashboard for this tenant
    branding: {
      logoUrl: { type: String, default: '' },
      primaryColor: { type: String, default: '#0A84FF' }, // Apple system blue default
      accentColor: { type: String, default: '#1D1D1F' },
      tagline: { type: String, default: '', maxlength: 140 },
    },
    contact: {
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
      pincode: { type: String, trim: true },
    },
    // Business settings that flow into forms/reports for this tenant
    settings: {
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      attendanceGraceMinutes: { type: Number, default: 15 },
      invoicePrefix: { type: String, default: 'INV' },
    },
    // GST + invoice presentation (feeds the PDF invoice header/footer)
    invoiceSettings: {
      gstin: { type: String, trim: true, uppercase: true, default: '' },
      panNumber: { type: String, trim: true, uppercase: true, default: '' },
      defaultGstRate: { type: Number, default: 18 }, // percent, editable per-payment too
      termsAndConditions: [{ type: String, trim: true }],
      footerNote: { type: String, trim: true, default: '' },
    },
    isActive: {
      type: Boolean,
      default: true, // platform superadmin can disable a tenant (e.g. non-payment)
    },
    subscription: {
      plan: { type: String, enum: ['trial', 'basic', 'pro', 'enterprise'], default: 'trial' },
      validTill: { type: Date },
    },
    paymentSettings: {
      upi: {
        vpa: { type: String, trim: true, default: '' },
        payeeName: { type: String, trim: true, default: '' },
      },
      enabledMethods: [{ type: String }],
      gateway: {
        provider: { type: String, trim: true, lowercase: true, default: '' }, // must match a PlatformSettings.gatewayProviders key
        credentials: { type: mongoose.Schema.Types.Mixed, default: {} },      // { fieldName: <encrypted string> }
        isLive: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);