const asyncHandler = require('express-async-handler');
const Member = require('../models/Member');
const MembershipPlan = require('../models/MembershipPlan');
const Payment = require('../models/Payment');

/** Generates the next memberCode for a company, e.g. GYM-0007 */
const nextMemberCode = async (companyId, companyCode) => {
  const count = await Member.countDocuments({ company: companyId });
  return `${companyCode || 'MEM'}-${String(count + 1).padStart(4, '0')}`;
};

/**
 * @desc  Register a new member (the dynamic, validated registration form)
 * @route POST /api/members
 * @access Private (owner, manager)
 */
const createMember = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phone,
    gender,
    dob,
    address,
    emergencyContact,
    healthNotes,
    goals,
    planId,
    amountPaid,
    paymentMethod,
  } = req.body;

  if (!fullName || !phone || !gender || !dob) {
    res.status(400);
    throw new Error('fullName, phone, gender and dob are required');
  }

  const memberCode = await nextMemberCode(req.user.company, req.body.companyCodePrefix);

  const member = new Member({
    company: req.user.company,
    memberCode,
    fullName,
    email,
    phone,
    gender,
    dob,
    address,
    emergencyContact,
    healthNotes,
    goals,
    createdBy: req.user._id,
  });

  // Optional: enroll into a plan at registration time
  if (planId) {
    const plan = await MembershipPlan.findOne({ _id: planId, company: req.user.company });
    if (!plan) {
      res.status(404);
      throw new Error('Selected membership plan not found');
    }
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationInDays);

    member.currentPlan = plan._id;
    member.membershipStart = startDate;
    member.membershipEnd = endDate;
    member.status = 'active';

    let paymentDoc = null;
    if (amountPaid !== undefined) {
      const invoiceCount = await Payment.countDocuments({ company: req.user.company });
      paymentDoc = await Payment.create({
        company: req.user.company,
        member: member._id,
        plan: plan._id,
        invoiceNumber: `INV-${String(invoiceCount + 1).padStart(5, '0')}`,
        amount: amountPaid,
        method: paymentMethod || 'cash',
        receivedBy: req.user._id,
      });
    }

    member.membershipHistory.push({
      plan: plan._id,
      startDate,
      endDate,
      amountPaid: amountPaid || plan.price,
      paymentRef: paymentDoc?._id,
    });
  }

  await member.save();
  res.status(201).json({ success: true, data: member });
});

/**
 * @desc  List members with pagination + filters
 * @route GET /api/members
 * @access Private
 */
const getMembers = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { company: req.user.company };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [members, total] = await Promise.all([
    Member.find(filter)
      .populate('currentPlan', 'name durationInDays price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Member.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: members,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  });
});

/**
 * @desc  Manual member search - by name, phone, email, or member code
 * @route GET /api/members/search?q=...
 * @access Private
 */
const searchMembers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    res.status(400);
    throw new Error('Provide at least 2 characters to search');
  }

  const regex = new RegExp(q.trim(), 'i');
  const members = await Member.find({
    company: req.user.company,
    $or: [{ fullName: regex }, { phone: regex }, { email: regex }, { memberCode: regex }],
  })
    .populate('currentPlan', 'name')
    .limit(25);

  res.json({ success: true, count: members.length, data: members });
});

/**
 * @desc  Get single member's full report card (profile + membership history + attendance summary)
 * @route GET /api/members/:id
 * @access Private
 */
const getMemberById = asyncHandler(async (req, res) => {
  const member = await Member.findOne({ _id: req.params.id, company: req.user.company })
    .populate('currentPlan')
    .populate('assignedTrainer', 'name email')
    .populate('membershipHistory.plan', 'name price durationInDays');

  if (!member) {
    res.status(404);
    throw new Error('Member not found');
  }

  const payments = await Payment.find({ company: req.user.company, member: member._id }).sort({
    paidAt: -1,
  });

  res.json({ success: true, data: { member, payments } });
});

/**
 * @desc  Update member profile / status
 * @route PUT /api/members/:id
 * @access Private
 */
const updateMember = asyncHandler(async (req, res) => {
  const member = await Member.findOne({ _id: req.params.id, company: req.user.company });
  if (!member) {
    res.status(404);
    throw new Error('Member not found');
  }

  const allowed = [
    'fullName',
    'email',
    'phone',
    'gender',
    'dob',
    'address',
    'emergencyContact',
    'healthNotes',
    'goals',
    'status',
    'assignedTrainer',
    'photoUrl',
  ];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) member[key] = req.body[key];
  });

  await member.save();
  res.json({ success: true, data: member });
});

/**
 * @desc  Renew / assign a membership plan to an existing member
 * @route POST /api/members/:id/renew
 * @access Private
 */
const renewMembership = asyncHandler(async (req, res) => {
  const { planId, amountPaid, paymentMethod } = req.body;
  const member = await Member.findOne({ _id: req.params.id, company: req.user.company });
  if (!member) {
    res.status(404);
    throw new Error('Member not found');
  }
  const plan = await MembershipPlan.findOne({ _id: planId, company: req.user.company });
  if (!plan) {
    res.status(404);
    throw new Error('Membership plan not found');
  }

  // Extend from current end date if still active & in future, else from today
  const base =
    member.membershipEnd && member.membershipEnd > new Date() ? member.membershipEnd : new Date();
  const startDate = base;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationInDays);

  const invoiceCount = await Payment.countDocuments({ company: req.user.company });
  const payment = await Payment.create({
    company: req.user.company,
    member: member._id,
    plan: plan._id,
    invoiceNumber: `INV-${String(invoiceCount + 1).padStart(5, '0')}`,
    amount: amountPaid ?? plan.price,
    method: paymentMethod || 'cash',
    receivedBy: req.user._id,
  });

  member.currentPlan = plan._id;
  member.membershipStart = member.membershipStart || startDate;
  member.membershipEnd = endDate;
  member.status = 'active';
  member.membershipHistory.push({
    plan: plan._id,
    startDate,
    endDate,
    amountPaid: amountPaid ?? plan.price,
    paymentRef: payment._id,
  });

  await member.save();
  res.json({ success: true, data: member });
});

module.exports = {
  createMember,
  getMembers,
  searchMembers,
  getMemberById,
  updateMember,
  renewMembership,
};
