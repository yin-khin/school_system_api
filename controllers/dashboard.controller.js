const { Student, Teacher, Class, Attendance, Fee, Payment, Exam, Announcement, User, Subject } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalStudents,
      maleStudents,
      femaleStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      todayAttendance,
      absentToday,
      pendingFees,
      totalRevenue,
      upcomingExams,
      totalAnnouncements
    ] = await Promise.all([
      Student.count({ where: { status: 'active' } }),
      Student.count({ where: { status: 'active', gender: 'male' } }),
      Student.count({ where: { status: 'active', gender: 'female' } }),
      Teacher.count({ where: { status: 'active' } }),
      Class.count({ where: { status: 'active' } }),
      Subject.count({ where: { status: 'active' } }),
      Attendance.count({ where: { date: today } }),
      Attendance.count({ where: { date: today, status: 'absent' } }),
      Fee.count({ where: { status: { [Op.in]: ['pending', 'partial', 'overdue'] } } }),
      Payment.sum('amount'),
      Exam.count({ where: { status: 'scheduled', exam_date: { [Op.gte]: today } } }),
      Announcement.count({ where: { status: 'published' } })
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        maleStudents,
        femaleStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        todayAttendance,
        absentToday,
        pendingFees,
        totalRevenue: totalRevenue || 0,
        upcomingExams,
        totalAnnouncements
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get student enrollment by year
// @route   GET /api/dashboard/enrollment
// @access  Private
const getEnrollment = async (req, res) => {
  try {
    const students = await Student.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'year', sequelize.col('admission_date')), 'year'],
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('date_trunc', 'year', sequelize.col('admission_date'))],
      order: [[sequelize.fn('date_trunc', 'year', sequelize.col('admission_date')), 'ASC']]
    });

    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get attendance statistics
// @route   GET /api/dashboard/attendance-stats
// @access  Private
const getAttendanceStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const where = {};
    if (start_date && end_date) {
      where.date = { [Op.between]: [start_date, end_date] };
    }

    const stats = await Attendance.findAll({
      attributes: [
        'date',
        'status',
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      where,
      group: ['date', 'status'],
      order: [['date', 'ASC']]
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get monthly revenue
// @route   GET /api/dashboard/revenue
// @access  Private
const getRevenue = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    const revenue = await Payment.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('payment_date')), 'month'],
        [sequelize.fn('sum', sequelize.col('amount')), 'total']
      ],
      where: {
        payment_date: {
          [Op.gte]: `${targetYear}-01-01`,
          [Op.lte]: `${targetYear}-12-31`
        }
      },
      group: [sequelize.fn('date_trunc', 'month', sequelize.col('payment_date'))],
      order: [[sequelize.fn('date_trunc', 'month', sequelize.col('payment_date')), 'ASC']]
    });

    res.json({ success: true, data: revenue });
  } catch (error) {
    console.error('Get revenue error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get class distribution
// @route   GET /api/dashboard/class-distribution
// @access  Private
const getClassDistribution = async (req, res) => {
  try {
    const distribution = await Student.findAll({
      attributes: [
        'class_id',
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      where: { status: 'active' },
      group: ['class_id'],
      include: [
        { model: Class, as: 'Class', attributes: ['id', 'name'] }
      ]
    });

    res.json({ success: true, data: distribution });
  } catch (error) {
    console.error('Get class distribution error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get recent activities
// @route   GET /api/dashboard/recent-activities
// @access  Private
const getRecentActivities = async (req, res) => {
  try {
    const [recentStudents, recentPayments, recentAnnouncements, recentExams] = await Promise.all([
      Student.findAll({ order: [['created_at', 'DESC']], limit: 5 }),
      Payment.findAll({ 
        order: [['created_at', 'DESC']], 
        limit: 5,
        include: [{ model: Student, as: 'Student', attributes: ['id', 'first_name', 'last_name'] }]
      }),
      Announcement.findAll({ order: [['published_at', 'DESC']], limit: 5 }),
      Exam.findAll({ 
        order: [['exam_date', 'DESC']], 
        limit: 5,
        include: [{ model: Subject, as: 'Subject', attributes: ['id', 'name'] }]
      })
    ]);

    res.json({
      success: true,
      data: {
        recentStudents,
        recentPayments,
        recentAnnouncements,
        recentExams
      }
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getStats,
  getEnrollment,
  getAttendanceStats,
  getRevenue,
  getClassDistribution,
  getRecentActivities
};