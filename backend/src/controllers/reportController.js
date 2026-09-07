const asyncHandler = require('express-async-handler');
const PDFDocument = require('pdfkit');
const Payment = require('../models/Payment');
const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const Company = require('../models/Company');
const User = require('../models/User');

/**
 * @desc  Platform-wide overview for the superadmin dashboard: how many gyms
 *        exist and how many are active, staff headcount by role, total
 *        members across the whole platform, and the most recently
 *        onboarded gyms (with their onboarding date).
 * @route GET /api/reports/platform
 * @access Private (superadmin)
 */
const getPlatformStats = asyncHandler(async (req, res) => {
  const [totalCompanies, activeCompanies, usersByRoleAgg, totalMembers, recentCompanies] =
    await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ isActive: true }),
      User.aggregate([
        { $match: { role: { $ne: 'superadmin' } } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Member.countDocuments(),
      Company.find().sort({ createdAt: -1 }).limit(6).select('name code createdAt isActive subscription'),
    ]);

  const usersByRole = { owner: 0, manager: 0, trainer: 0 };
  usersByRoleAgg.forEach((r) => {
    usersByRole[r._id] = r.count;
  });
  const totalStaff = Object.values(usersByRole).reduce((a, b) => a + b, 0);

  res.json({
    success: true,
    data: {
      totalCompanies,
      activeCompanies,
      inactiveCompanies: totalCompanies - activeCompanies,
      totalStaff,
      usersByRole,
      totalMembers,
      recentCompanies,
    },
  });
});

/**
 * @desc  Dashboard summary cards: total members, active members, today's attendance,
 *        this month's revenue, expiring-soon count.
 * @route GET /api/reports/dashboard
 * @access Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const company = req.user.company;
  const today = new Date().toISOString().slice(0, 10);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);

  const [totalMembers, activeMembers, todaysAttendance, monthRevenueAgg, expiringSoon] =
    await Promise.all([
      Member.countDocuments({ company }),
      Member.countDocuments({ company, status: 'active' }),
      Attendance.countDocuments({ company, date: today }),
      Payment.aggregate([
        { $match: { company, status: 'paid', paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Member.countDocuments({
        company,
        status: 'active',
        membershipEnd: { $gte: new Date(), $lte: in7Days },
      }),
    ]);

  res.json({
    success: true,
    data: {
      totalMembers,
      activeMembers,
      todaysAttendance,
      monthRevenue: monthRevenueAgg[0]?.total || 0,
      expiringSoon,
    },
  });
});

/**
 * @desc  Revenue report grouped by day within a date range
 * @route GET /api/reports/revenue?from=&to=
 * @access Private
 */
const getRevenueReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { company: req.user.company, status: 'paid' };
  if (from || to) {
    match.paidAt = {};
    if (from) match.paidAt.$gte = new Date(from);
    if (to) match.paidAt.$lte = new Date(to);
  }

  const [byDay, totalAgg] = await Promise.all([
    Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Payment.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  res.json({
    success: true,
    data: { byDay, totalRevenue: totalAgg[0]?.total || 0 },
  });
});

/**
 * @desc  Export the revenue report as a PDF
 * @route GET /api/reports/revenue/export?from=&to=
 * @access Private
 */
const exportRevenuePdf = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { company: req.user.company, status: 'paid' };
  if (from || to) {
    match.paidAt = {};
    if (from) match.paidAt.$gte = new Date(from);
    if (to) match.paidAt.$lte = new Date(to);
  }

  const [company, payments] = await Promise.all([
    Company.findById(req.user.company),
    Payment.find(match).populate('member', 'fullName memberCode').populate('plan', 'name').sort({
      paidAt: 1,
    }),
  ]);

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="revenue-report.pdf"');

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(18).text(`${company?.name || 'Gym'} - Revenue Report`, { align: 'left' });
  doc.fontSize(10).fillColor('#666').text(
    `${from ? `From ${from} ` : ''}${to ? `to ${to}` : ''}  |  Generated ${new Date().toLocaleString()}`
  );
  doc.moveDown(1);

  // Table header
  const startX = 40;
  let y = doc.y;
  doc.fontSize(10).fillColor('#000');
  doc.text('Date', startX, y, { width: 80 });
  doc.text('Invoice #', startX + 80, y, { width: 90 });
  doc.text('Member', startX + 170, y, { width: 140 });
  doc.text('Plan', startX + 310, y, { width: 110 });
  doc.text('Amount', startX + 420, y, { width: 80, align: 'right' });
  y += 16;
  doc.moveTo(startX, y).lineTo(555, y).strokeColor('#ccc').stroke();
  y += 6;

  payments.forEach((p) => {
    if (y > 760) {
      doc.addPage();
      y = 40;
    }
    doc.fontSize(9).fillColor('#111');
    doc.text(new Date(p.paidAt).toLocaleDateString(), startX, y, { width: 80 });
    doc.text(p.invoiceNumber, startX + 80, y, { width: 90 });
    doc.text(p.member?.fullName || '-', startX + 170, y, { width: 140 });
    doc.text(p.plan?.name || '-', startX + 310, y, { width: 110 });
    doc.text(`Rs. ${p.amount.toFixed(2)}`, startX + 420, y, { width: 80, align: 'right' });
    y += 16;
  });

  y += 10;
  doc.moveTo(startX, y).lineTo(555, y).strokeColor('#ccc').stroke();
  y += 10;
  doc.fontSize(11).fillColor('#000').text(`Total Revenue: Rs. ${total.toFixed(2)}`, startX, y, {
    align: 'right',
    width: 515,
  });

  doc.end();
});

/**
 * @desc  Export a single member's report card as PDF (profile + payments + attendance)
 * @route GET /api/reports/member/:id/export
 * @access Private
 */
const exportMemberReportCard = asyncHandler(async (req, res) => {
  const [company, member, payments, attendance] = await Promise.all([
    Company.findById(req.user.company),
    Member.findOne({ _id: req.params.id, company: req.user.company }).populate(
      'currentPlan',
      'name price durationInDays'
    ),
    Payment.find({ company: req.user.company, member: req.params.id }).sort({ paidAt: -1 }),
    Attendance.find({ company: req.user.company, member: req.params.id })
      .sort({ date: -1 })
      .limit(30),
  ]);

  if (!member) {
    res.status(404);
    throw new Error('Member not found');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${member.memberCode}-report-card.pdf"`
  );

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(18).text(`${company?.name || 'Gym'}`, { align: 'left' });
  doc.fontSize(14).fillColor('#333').text('Member Report Card');
  doc.moveDown(0.5);

  doc.fontSize(11).fillColor('#000');
  doc.text(`Name: ${member.fullName}`);
  doc.text(`Member Code: ${member.memberCode}`);
  doc.text(`Phone: ${member.phone}`);
  if (member.email) doc.text(`Email: ${member.email}`);
  doc.text(`Status: ${member.status}`);
  if (member.currentPlan) {
    doc.text(`Current Plan: ${member.currentPlan.name} (Rs. ${member.currentPlan.price})`);
  }
  if (member.membershipEnd) {
    doc.text(`Membership Valid Till: ${new Date(member.membershipEnd).toLocaleDateString()}`);
  }

  doc.moveDown(1);
  doc.fontSize(13).text('Payment History');
  doc.moveDown(0.3);
  doc.fontSize(9);
  payments.forEach((p) => {
    doc.text(
      `${new Date(p.paidAt).toLocaleDateString()}  |  ${p.invoiceNumber}  |  Rs. ${p.amount.toFixed(2)}  |  ${p.method}`
    );
  });
  if (!payments.length) doc.fontSize(9).fillColor('#888').text('No payments recorded.');

  doc.moveDown(1);
  doc.fontSize(13).fillColor('#000').text('Recent Attendance (last 30)');
  doc.moveDown(0.3);
  doc.fontSize(9);
  attendance.forEach((a) => {
    doc.text(`${a.date}  -  Checked in at ${new Date(a.checkInTime).toLocaleTimeString()}`);
  });
  if (!attendance.length) doc.fontSize(9).fillColor('#888').text('No attendance recorded yet.');

  doc.end();
});

module.exports = {
  getPlatformStats,
  getDashboardStats,
  getRevenueReport,
  exportRevenuePdf,
  exportMemberReportCard,
};