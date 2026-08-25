const { Attendance, Student, Class, Section } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { date, class_id, section_id, student_id, status } = req.query;

    const where = {};
    if (date) where.date = date;
    if (class_id) where.class_id = class_id;
    if (section_id) where.section_id = section_id;
    if (student_id) where.student_id = student_id;
    if (status) where.status = status;

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      include: [
        { model: Student, as: 'Student', attributes: ['id', 'student_id', 'first_name', 'last_name', 'photo'] },
        { model: Class, as: 'Class', attributes: ['id', 'name', 'code'] }
      ],
      order: [['date', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get attendance by date and class
// @route   GET /api/attendance/class/:classId/date/:date
// @access  Private
const getAttendanceByClassAndDate = async (req, res) => {
  try {
    const { classId, date } = req.params;

    const attendance = await Attendance.findAll({
      where: { class_id: classId, date },
      include: [
        { model: Student, as: 'Student', attributes: ['id', 'student_id', 'first_name', 'last_name', 'photo', 'roll_number'] }
      ],
      order: [['created_at', 'ASC']]
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Get attendance by class and date error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create attendance (bulk)
// @route   POST /api/attendance
// @access  Private
const createAttendance = async (req, res) => {
  try {
    const { records } = req.body;
    const recordedBy = req.user.id;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Please provide attendance records' });
    }

    const createdRecords = [];

    for (const record of records) {
      const { student_id, class_id, section_id, date, status, remark } = record;

      // Check if attendance already exists for this student on this date
      const existing = await Attendance.findOne({
        where: { student_id, date }
      });

      if (existing) {
        // Update existing record
        await existing.update({ status, remark, class_id, section_id, recorded_by: recordedBy });
        createdRecords.push(existing);
      } else {
        // Create new record
        const newRecord = await Attendance.create({
          student_id,
          class_id,
          section_id,
          date,
          status,
          remark,
          recorded_by: recordedBy
        });
        createdRecords.push(newRecord);
      }
    }

    res.status(201).json({ success: true, data: createdRecords });
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Private
const updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    await attendance.update(req.body);

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete attendance
// @route   DELETE /api/attendance/:id
// @access  Private
const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    await attendance.destroy();

    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get attendance report for student
// @route   GET /api/attendance/student/:studentId/report
// @access  Private
const getStudentAttendanceReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { start_date, end_date } = req.query;

    const where = { student_id: studentId };
    if (start_date && end_date) {
      where.date = { [Op.between]: [start_date, end_date] };
    }

    const records = await Attendance.findAll({ where });

    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const excused = records.filter(r => r.status === 'excused').length;
    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        total,
        present,
        absent,
        late,
        excused,
        percentage: parseFloat(percentage)
      }
    });
  } catch (error) {
    console.error('Get student attendance report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get attendance records for a date range (no pagination)
// @route   GET /api/attendance/range
// @access  Private
const getAttendanceRange = async (req, res) => {
  try {
    const { class_id, student_id, start_date, end_date } = req.query;

    const where = {};
    if (class_id) where.class_id = class_id;
    if (student_id) where.student_id = student_id;
    if (start_date && end_date) {
      where.date = { [Op.between]: [start_date, end_date] };
    }

    const records = await Attendance.findAll({
      where,
      include: [
        {
          model: Student,
          as: "Student",
          attributes: [
            "id",
            "student_id",
            "first_name",
            "last_name",
            "photo",
            "roll_number",
          ],
        },
        { model: Class, as: "Class", attributes: ["id", "name", "code"] },
      ],
      order: [
        ["date", "ASC"],
        ["student_id", "ASC"],
      ],
    });

    res.json({ success: true, data: records });
  } catch (error) {
    console.error("Get attendance range error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAttendance,
  getAttendanceByClassAndDate,
  getAttendanceRange,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getStudentAttendanceReport,
};