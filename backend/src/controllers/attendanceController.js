const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const Member = require('../models/Member');

const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * @desc  Mark attendance for a member from the dashboard (search-and-tap flow)
 * @route POST /api/attendance
 * @access Private (owner, manager, trainer)
 */
const markAttendance = asyncHandler(async (req, res) => {
  const { memberId, date } = req.body;
  if (!memberId) {
    res.status(400);
    throw new Error('memberId is required');
  }

  const member = await Member.findOne({ _id: memberId, company: req.user.company });
  if (!member) {
    res.status(404);
    throw new Error('Member not found');
  }

  const attendanceDate = date || todayStr();

  const existing = await Attendance.findOne({
    company: req.user.company,
    member: memberId,
    date: attendanceDate,
  });
  if (existing) {
    res.status(409);
    throw new Error(`${member.fullName} is already marked present for ${attendanceDate}`);
  }

  const record = await Attendance.create({
    company: req.user.company,
    member: memberId,
    date: attendanceDate,
    checkInTime: new Date(),
    markedBy: req.user._id,
  });

  res.status(201).json({ success: true, data: record });
});

/**
 * @desc  List attendance for a given date (defaults to today) - the daily roster
 * @route GET /api/attendance?date=YYYY-MM-DD
 * @access Private
 */
const getAttendanceByDate = asyncHandler(async (req, res) => {
  const date = req.query.date || todayStr();
  const records = await Attendance.find({ company: req.user.company, date })
    .populate('member', 'fullName memberCode phone photoUrl')
    .populate('markedBy', 'name')
    .sort({ checkInTime: -1 });

  res.json({ success: true, date, count: records.length, data: records });
});

/**
 * @desc  Attendance history for one member (feeds the member report card)
 * @route GET /api/attendance/member/:memberId
 * @access Private
 */
const getMemberAttendanceHistory = asyncHandler(async (req, res) => {
  const records = await Attendance.find({
    company: req.user.company,
    member: req.params.memberId,
  }).sort({ date: -1 });
  res.json({ success: true, count: records.length, data: records });
});

module.exports = { markAttendance, getAttendanceByDate, getMemberAttendanceHistory };
