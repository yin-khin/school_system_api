const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAttendance,
  getAttendanceByClassAndDate,
  getAttendanceRange,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getStudentAttendanceReport
} = require('../controllers/attendance.controller');

router.use(protect);

router.get('/', getAttendance);
router.get('/range', getAttendanceRange);
router.get('/class/:classId/date/:date', getAttendanceByClassAndDate);
router.get('/student/:studentId/report', getStudentAttendanceReport);
router.post('/', createAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

module.exports = router;