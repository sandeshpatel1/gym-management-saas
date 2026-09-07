const express = require('express');
const {
  markAttendance,
  getAttendanceByDate,
  getMemberAttendanceHistory,
} = require('../controllers/attendanceController');
const { protect, authorize, requireCompanyScope } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireCompanyScope);

router.get('/', getAttendanceByDate);
router.post('/', authorize('owner', 'manager', 'trainer'), markAttendance);
router.get('/member/:memberId', getMemberAttendanceHistory);

module.exports = router;
