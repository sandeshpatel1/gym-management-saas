const asyncHandler = require('express-async-handler');
const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const FollowUp = require('../models/FollowUp');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Builds the list of members who currently need a follow-up call, split into
 * three buckets:
 *  - 'trial'    : registered but never purchased a plan (walk-in enquiry)
 *  - 'inactive' : has a plan but membership status isn't 'active'
 *                 (expired / cancelled / frozen)
 *  - 'absent'   : active membership + plan, but no gym visit in 7+ days
 * Each entry carries the member's most recent logged follow-up (if any) so
 * staff can see what was last discussed before calling again.
 */
const buildFollowUpCandidates = async (companyId) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - SEVEN_DAYS_MS);

  const members = await Member.find({ company: companyId }).populate('currentPlan', 'name');
  const memberIds = members.map((m) => m._id);

  const lastAttendanceAgg = await Attendance.aggregate([
    { $match: { company: companyId, member: { $in: memberIds } } },
    { $group: { _id: '$member', lastDate: { $max: '$date' } } },
  ]);
  const lastAttendanceMap = {};
  lastAttendanceAgg.forEach((a) => {
    lastAttendanceMap[String(a._id)] = a.lastDate;
  });

  const followUps = await FollowUp.find({ company: companyId })
    .sort({ createdAt: -1 })
    .populate('calledBy', 'name');
  const lastFollowUpMap = {};
  followUps.forEach((f) => {
    const key = String(f.member);
    if (!lastFollowUpMap[key]) lastFollowUpMap[key] = f;
  });

  const candidates = [];

  members.forEach((member) => {
    let type = null;

    if (!member.currentPlan) {
      type = 'trial';
    } else if (member.status !== 'active') {
      type = 'inactive';
    } else {
      const lastDateStr = lastAttendanceMap[String(member._id)];
      const lastDate = lastDateStr ? new Date(lastDateStr) : null;
      if (!lastDate || lastDate < cutoff) {
        type = 'absent';
      }
    }

    if (type) {
      const lastFollowUp = lastFollowUpMap[String(member._id)];
      candidates.push({
        member: {
          _id: member._id,
          fullName: member.fullName,
          memberCode: member.memberCode,
          phone: member.phone,
          email: member.email,
          status: member.status,
          currentPlan: member.currentPlan,
          membershipEnd: member.membershipEnd,
          joinedAt: member.joinedAt,
        },
        type,
        lastAttendance: lastAttendanceMap[String(member._id)] || null,
        lastFollowUp: lastFollowUp
          ? {
              reason: lastFollowUp.reason,
              calledAt: lastFollowUp.calledAt,
              calledBy: lastFollowUp.calledBy?.name,
            }
          : null,
      });
    }
  });

  // Most recently followed-up-with members last; untouched ones surface first
  candidates.sort((a, b) => {
    const aTime = a.lastFollowUp ? new Date(a.lastFollowUp.calledAt).getTime() : 0;
    const bTime = b.lastFollowUp ? new Date(b.lastFollowUp.calledAt).getTime() : 0;
    return aTime - bTime;
  });

  return candidates;
};

/**
 * @desc  Lightweight counts + a short preview - used by the dashboard
 *        popup/alert so it doesn't have to pull the full list.
 * @route GET /api/follow-ups/summary
 * @access Private
 */
const getFollowUpSummary = asyncHandler(async (req, res) => {
  const candidates = await buildFollowUpCandidates(req.user.company);
  const counts = { absent: 0, inactive: 0, trial: 0 };
  candidates.forEach((c) => counts[c.type]++);
  res.json({
    success: true,
    data: {
      total: candidates.length,
      counts,
      preview: candidates.slice(0, 5),
    },
  });
});

/**
 * @desc  Full follow-up candidate list for the dedicated page.
 *        Optional ?type=absent|inactive|trial filter.
 * @route GET /api/follow-ups
 * @access Private
 */
const getFollowUpList = asyncHandler(async (req, res) => {
  let candidates = await buildFollowUpCandidates(req.user.company);
  if (req.query.type) {
    candidates = candidates.filter((c) => c.type === req.query.type);
  }
  res.json({ success: true, count: candidates.length, data: candidates });
});

/**
 * @desc  Log a follow-up call/reason against a member
 * @route POST /api/follow-ups
 * @access Private (owner, manager, trainer)
 */
const createFollowUp = asyncHandler(async (req, res) => {
  const { memberId, type, reason } = req.body;

  if (!memberId || !type || !reason) {
    res.status(400);
    throw new Error('memberId, type and reason are required');
  }
  if (!['absent', 'inactive', 'trial'].includes(type)) {
    res.status(400);
    throw new Error('Invalid follow-up type');
  }

  const member = await Member.findOne({ _id: memberId, company: req.user.company });
  if (!member) {
    res.status(404);
    throw new Error('Member not found');
  }

  const followUp = await FollowUp.create({
    company: req.user.company,
    member: memberId,
    type,
    reason,
    calledBy: req.user._id,
  });

  const populated = await followUp.populate('calledBy', 'name');

  res.status(201).json({ success: true, data: populated });
});

/**
 * @desc  Follow-up history for a single member
 * @route GET /api/follow-ups/member/:memberId
 * @access Private
 */
const getMemberFollowUps = asyncHandler(async (req, res) => {
  const followUps = await FollowUp.find({
    company: req.user.company,
    member: req.params.memberId,
  })
    .sort({ createdAt: -1 })
    .populate('calledBy', 'name');
  res.json({ success: true, count: followUps.length, data: followUps });
});

module.exports = {
  getFollowUpSummary,
  getFollowUpList,
  createFollowUp,
  getMemberFollowUps,
};