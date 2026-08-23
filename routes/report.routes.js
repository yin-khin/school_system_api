const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getStudentReport,
  getAttendanceReport,
  getFeeReport,
  getAcademicReport,
  getTeacherReport
} = require('../controllers/report.controller');

router.use(protect);

router.get('/students', getStudentReport);
router.get('/attendance', getAttendanceReport);
router.get('/fees', getFeeReport);
router.get('/academic', getAcademicReport);
router.get('/teachers', getTeacherReport);

module.exports = router;