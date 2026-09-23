const mongoose = require('mongoose');

/**
 * ImpersonationLog = an audit trail entry for superadmin's "Manage this
 * gym" feature. One row per session start ('enter'), per session end
 * ('exit'), and per write (POST/PUT/PATCH/DELETE) made against a gym's
 * data while managing it. Nothing here is ever updated or deleted through
 * the API - it's append-only, read via GET /api/impersonation.
 */
const impersonationLogSchema = new mongoose.Schema(
  {
    superadmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    superadminName: { type: String, trim: true }, // denormalized so the log still reads clearly if the account is later removed
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    companyName: { type: String, trim: true },
    action: { type: String, enum: ['enter', 'exit', 'write'], required: true },
    method: { type: String }, // only set for 'write' entries
    path: { type: String },
    statusCode: { type: Number },
    body: { type: mongoose.Schema.Types.Mixed }, // redacted request body, only for 'write' entries
  },
  { timestamps: true }
);

impersonationLogSchema.index({ company: 1, createdAt: -1 });
impersonationLogSchema.index({ superadmin: 1, createdAt: -1 });

module.exports = mongoose.model('ImpersonationLog', impersonationLogSchema);