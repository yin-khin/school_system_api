// const { Student, Teacher, Class, Attendance, Fee, Payment, Mark, Exam, Subject } = require('../models');
// const { Op } = require('sequelize');

// // @desc    Get student list report
// // @route   GET /api/reports/students
// // @access  Private
// const getStudentReport = async (req, res) => {
//   try {
//     const { class_id, status } = req.query;

//     const where = {};
//     if (class_id) where.class_id = class_id;
//     if (status) where.status = status;

//     const students = await Student.findAll({
//       where,
//       include: [
//         { model: Class, as: 'Class', attributes: ['id', 'name', 'code'] }
//       ],
//       order: [['student_id', 'ASC']]
//     });

//     res.json({ success: true, data: students });
//   } catch (error) {
//     console.error('Get student report error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // @desc    Get attendance report
// // @route   GET /api/reports/attendance
// // @access  Private
// const getAttendanceReport = async (req, res) => {
//   try {
//     const { start_date, end_date, class_id } = req.query;

//     const where = {};
//     if (start_date && end_date) {
//       where.date = { [Op.between]: [start_date, end_date] };
//     }
//     if (class_id) where.class_id = class_id;

//     const records = await Attendance.findAll({
//       where,
//       include: [
//         { model: Student, as: 'Student', attributes: ['id', 'student_id', 'first_name', 'last_name'] },
//         { model: Class, as: 'Class', attributes: ['id', 'name', 'code'] }
//       ],
//       order: [['date', 'ASC']]
//     });

//     res.json({ success: true, data: records });
//   } catch (error) {
//     console.error('Get attendance report error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // @desc    Get fee report
// // @route   GET /api/reports/fees
// // @access  Private
// const getFeeReport = async (req, res) => {
//   try {
//     const { status, start_date, end_date } = req.query;

//     const where = {};
//     if (status) where.status = status;
//     if (start_date && end_date) {
//       where.created_at = { [Op.between]: [start_date, end_date] };
//     }

//     const fees = await Fee.findAll({
//       where,
//       include: [
//         { model: Student, as: 'Student', attributes: ['id', 'student_id', 'first_name', 'last_name'] }
//       ],
//       order: [['created_at', 'DESC']]
//     });

//     const totalAmount = fees.reduce((sum, f) => sum + parseFloat(f.amount), 0);
//     const totalPaid = fees.reduce((sum, f) => sum + parseFloat(f.paid_amount), 0);
//     const totalOutstanding = totalAmount - totalPaid;

//     res.json({
//       success: true,
//       data: {
//         fees,
//         summary: {
//           totalAmount,
//           totalPaid,
//           totalOutstanding
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get fee report error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // @desc    Get academic report
// // @route   GET /api/reports/academic
// // @access  Private
// const getAcademicReport = async (req, res) => {
//   try {
//     const { exam_id, class_id } = req.query;

//     const where = {};
//     if (exam_id) where.exam_id = exam_id;
//     if (class_id) where.class_id = class_id;

//     const marks = await Mark.findAll({
//       where,
//       include: [
//         { model: Exam, as: 'Exam', attributes: ['id', 'name', 'exam_date'] },
//         { model: Student, as: 'Student', attributes: ['id', 'student_id', 'first_name', 'last_name'] },
//         { model: Subject, as: 'Subject', attributes: ['id', 'name', 'code'] }
//       ],
//       order: [['created_at', 'DESC']]
//     });

//     res.json({ success: true, data: marks });
//   } catch (error) {
//     console.error('Get academic report error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // @desc    Get teacher report
// // @route   GET /api/reports/teachers
// // @access  Private
// const getTeacherReport = async (req, res) => {
//   try {
//     const { status } = req.query;

//     const where = {};
//     if (status) where.status = status;

//     const teachers = await Teacher.findAll({
//       where,
//       include: [
//         { model: Class, as: 'Classes', attributes: ['id', 'name', 'code'] },
//         { model: Subject, as: 'Subjects', attributes: ['id', 'name', 'code'] }
//       ],
//       order: [['teacher_id', 'ASC']]
//     });

//     res.json({ success: true, data: teachers });
//   } catch (error) {
//     console.error('Get teacher report error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// module.exports = {
//   getStudentReport,
//   getAttendanceReport,
//   getFeeReport,
//   getAcademicReport,
//   getTeacherReport
// };


const { Student, Teacher, Class, Attendance, Fee, Payment, Mark, Exam, Subject } = require('../models');
const { Op } = require('sequelize');

// Allowed status values per report. Filtering by a value that is not in the
// database enum (e.g. "paid" on students) makes Postgres throw a 500 error.
const STUDENT_STATUSES = ['active', 'inactive', 'graduated', 'transferred', 'suspended'];
const TEACHER_STATUSES = ['active', 'inactive', 'on_leave', 'resigned'];
const FEE_STATUSES = ['pending', 'partial', 'paid', 'overdue', 'cancelled'];

const normalizeStatus = (status) => (status ? String(status).toLowerCase() : '');
const num = (value) => parseFloat(value) || 0;

// @desc    Get student list report
// @route   GET /api/reports/students
// @access  Private
const getStudentReport = async (req, res) => {
  try {
    const { class_id } = req.query;
    const status = normalizeStatus(req.query.status);

    // A status that students cannot have matches nothing
    if (status && !STUDENT_STATUSES.includes(status)) {
      return res.json({ success: true, data: [] });
    }

    const where = {};
    if (class_id) where.class_id = class_id;
    if (status) where.status = status;

    const students = await Student.findAll({
      where,
      include: [
        { model: Class, as: 'Class', attributes: ['id', 'name', 'code'] }
      ],
      order: [['student_id', 'ASC']]
    });

    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Get student report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get attendance report
// @route   GET /api/reports/attendance
// @access  Private
const getAttendanceReport = async (req, res) => {
  try {
    const { start_date, end_date, class_id } = req.query;

    const where = {};
    if (start_date && end_date) {
      where.date = { [Op.between]: [start_date, end_date] };
    }
    if (class_id) where.class_id = class_id;

    const records = await Attendance.findAll({
      where,
      include: [
        { model: Student, as: 'Student', attributes: ['id', 'student_id', 'first_name', 'last_name'] },
        { model: Class, as: 'Class', attributes: ['id', 'name', 'code'] }
      ],
      order: [['date', 'ASC']]
    });

    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get fee report
// @route   GET /api/reports/fees
// @access  Private
const getFeeReport = async (req, res) => {
  try {
    const { start_date, end_date, class_id } = req.query;
    const status = normalizeStatus(req.query.status);

    // A status that fees cannot have matches nothing
    if (status && !FEE_STATUSES.includes(status)) {
      return res.json({
        success: true,
        data: { fees: [], summary: { totalAmount: 0, totalPaid: 0, totalOutstanding: 0 } }
      });
    }

    const where = {};
    if (status) where.status = status;
    if (start_date && end_date) {
      where.created_at = { [Op.between]: [start_date, end_date] };
    }

    // The fees table has no class column, so filter through the student
    const studentInclude = {
      model: Student,
      as: 'Student',
      attributes: ['id', 'student_id', 'first_name', 'last_name', 'class_id']
    };
    if (class_id) {
      studentInclude.where = { class_id };
      studentInclude.required = true;
    }

    const fees = await Fee.findAll({
      where,
      include: [studentInclude],
      order: [['created_at', 'DESC']]
    });

    const totalAmount = fees.reduce((sum, f) => sum + num(f.amount), 0);
    const totalPaid = fees.reduce((sum, f) => sum + num(f.paid_amount), 0);
    const totalOutstanding = totalAmount - totalPaid;

    res.json({
      success: true,
      data: {
        fees,
        summary: {
          totalAmount,
          totalPaid,
          totalOutstanding
        }
      }
    });
  } catch (error) {
    console.error('Get fee report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get academic report
// @route   GET /api/reports/academic
// @access  Private
const getAcademicReport = async (req, res) => {
  try {
    const { exam_id, class_id } = req.query;

    const where = {};
    if (exam_id) where.exam_id = exam_id;

    // The marks table has no class_id column (that caused "column Mark.class_id
    // does not exist"), so filter through the student's class instead
    const studentInclude = {
      model: Student,
      as: 'Student',
      attributes: ['id', 'student_id', 'first_name', 'last_name', 'class_id']
    };
    if (class_id) {
      studentInclude.where = { class_id };
      studentInclude.required = true;
    }

    const marks = await Mark.findAll({
      where,
      include: [
        { model: Exam, as: 'Exam', attributes: ['id', 'name', 'exam_date'] },
        studentInclude,
        { model: Subject, as: 'Subject', attributes: ['id', 'name', 'code'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: marks });
  } catch (error) {
    console.error('Get academic report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get teacher report
// @route   GET /api/reports/teachers
// @access  Private
const getTeacherReport = async (req, res) => {
  try {
    const { class_id } = req.query;
    const status = normalizeStatus(req.query.status);

    // A status that teachers cannot have matches nothing
    if (status && !TEACHER_STATUSES.includes(status)) {
      return res.json({ success: true, data: [] });
    }

    const where = {};
    if (status) where.status = status;

    const classInclude = { model: Class, as: 'Classes', attributes: ['id', 'name', 'code'] };
    if (class_id) {
      classInclude.where = { id: class_id };
      classInclude.required = true;
    }

    const teachers = await Teacher.findAll({
      where,
      include: [
        classInclude,
        { model: Subject, as: 'Subjects', attributes: ['id', 'name', 'code'] }
      ],
      order: [['teacher_id', 'ASC']]
    });

    res.json({ success: true, data: teachers });
  } catch (error) {
    console.error('Get teacher report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getStudentReport,
  getAttendanceReport,
  getFeeReport,
  getAcademicReport,
  getTeacherReport
};
