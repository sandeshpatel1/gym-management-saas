const express = require('express');
const {
  markAttendance,
  getAttendanceByDate,
  getMemberAttendanceHistory,
  qrCheckIn,
} = require('../controllers/attendanceController');
const { protect, authorize, requireCompanyScope } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireCompanyScope);

router.get('/', getAttendanceByDate);
router.post('/', authorize('owner', 'manager', 'trainer'), markAttendance);
router.post('/qr-checkin', authorize('owner', 'manager', 'trainer'), qrCheckIn);
router.get('/member/:memberId', getMemberAttendanceHistory);

module.exports = router;