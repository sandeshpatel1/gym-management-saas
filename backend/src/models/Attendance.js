const mongoose = require('mongoose');

/**
 * Attendance = one check-in record. Marked from the dashboard (manual tap/search)
 * or, later, a kiosk/QR flow. One record per member per day is enforced.
 */
const attendanceSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    date: { type: String, required: true }, // stored as 'YYYY-MM-DD' in company timezone for easy uniqueness/reporting
    checkInTime: { type: Date, required: true, default: Date.now },
    checkOutTime: { type: Date },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, enum: ['dashboard', 'kiosk', 'qr'], default: 'dashboard' },
  },
  { timestamps: true }
);

attendanceSchema.index({ company: 1, member: 1, date: 1 }, { unique: true });
attendanceSchema.index({ company: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
