const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getStats,
  getEnrollment,
  getAttendanceStats,
  getRevenue,
  getClassDistribution,
  getRecentActivities
} = require('../controllers/dashboard.controller');

router.use(protect);

router.get('/stats', getStats);
router.get('/enrollment', getEnrollment);
router.get('/attendance-stats', getAttendanceStats);
router.get('/revenue', getRevenue);
router.get('/class-distribution', getClassDistribution);
router.get('/recent-activities', getRecentActivities);

module.exports = router;