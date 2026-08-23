const { Mark, Exam, Student, Subject } = require('../models');
const { Op } = require('sequelize');

// Helper function to calculate grade
const calculateGrade = (marks, totalMarks) => {
  const percentage = (marks / totalMarks) * 100;
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

// @desc    Get all marks
// @route   GET /api/marks
// @access  Private
const getMarks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { exam_id, student_id, subject_id } = req.query;

    const where = {};
    if (exam_id) where.exam_id = exam_id;
    if (student_id) where.student_id = student_id;
    if (subject_id) where.subject_id = subject_id;

    const { count, rows } = await Mark.findAndCountAll({
      where,
      include: [
        { model: Exam, as: 'Exam', attributes: ['id', 'name', 'exam_date'] },
        { model: Student, as: 'Student', attributes: ['id', 'student_id', 'first_name', 'last_name'] },
        { model: Subject, as: 'Subject', attributes: ['id', 'name', 'code'] }
      ],
      order: [['created_at', 'DESC']],
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
    console.error('Get marks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get marks by exam
// @route   GET /api/marks/exam/:examId
// @access  Private
const getMarksByExam = async (req, res) => {
  try {
    const marks = await Mark.findAll({
      where: { exam_id: req.params.examId },
      include: [
        { model: Student, as: 'Student', attributes: ['id', 'student_id', 'first_name', 'last_name', 'roll_number'] }
      ],
      order: [['created_at', 'ASC']]
    });

    res.json({ success: true, data: marks });
  } catch (error) {
    console.error('Get marks by exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create marks (bulk)
// @route   POST /api/marks
// @access  Private
const createMarks = async (req, res) => {
  try {
    const { records } = req.body;
    const enteredBy = req.user.id;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Please provide mark records' });
    }

    const createdMarks = [];

    for (const record of records) {
      const { exam_id, student_id, subject_id, marks_obtained, total_marks, remark } = record;

      const grade = calculateGrade(parseFloat(marks_obtained), parseInt(total_marks) || 100);

      // Check if mark already exists
      const existing = await Mark.findOne({
        where: { exam_id, student_id, subject_id }
      });

      if (existing) {
        await existing.update({
          marks_obtained,
          total_marks,
          grade,
          remark,
          entered_by: enteredBy
        });
        createdMarks.push(existing);
      } else {
        const newMark = await Mark.create({
          exam_id,
          student_id,
          subject_id,
          marks_obtained,
          total_marks,
          grade,
          remark,
          entered_by: enteredBy
        });
        createdMarks.push(newMark);
      }
    }

    res.status(201).json({ success: true, data: createdMarks });
  } catch (error) {
    console.error('Create marks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update mark
// @route   PUT /api/marks/:id
// @access  Private
const updateMark = async (req, res) => {
  try {
    const mark = await Mark.findByPk(req.params.id);

    if (!mark) {
      return res.status(404).json({ message: 'Mark not found' });
    }

    const updateData = { ...req.body };
    if (updateData.marks_obtained && updateData.total_marks) {
      updateData.grade = calculateGrade(parseFloat(updateData.marks_obtained), parseInt(updateData.total_marks));
    }

    await mark.update(updateData);

    res.json({ success: true, data: mark });
  } catch (error) {
    console.error('Update mark error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete mark
// @route   DELETE /api/marks/:id
// @access  Private
const deleteMark = async (req, res) => {
  try {
    const mark = await Mark.findByPk(req.params.id);

    if (!mark) {
      return res.status(404).json({ message: 'Mark not found' });
    }

    await mark.destroy();

    res.json({ success: true, message: 'Mark deleted successfully' });
  } catch (error) {
    console.error('Delete mark error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get student results
// @route   GET /api/marks/student/:studentId/results
// @access  Private
const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;

    const marks = await Mark.findAll({
      where: { student_id: studentId },
      include: [
        { model: Exam, as: 'Exam', attributes: ['id', 'name', 'exam_date'] },
        { model: Subject, as: 'Subject', attributes: ['id', 'name', 'code'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // Calculate summary
    const totalMarks = marks.reduce((sum, m) => sum + parseFloat(m.marks_obtained), 0);
    const totalPossible = marks.reduce((sum, m) => sum + parseInt(m.total_marks), 0);
    const average = marks.length > 0 ? (totalMarks / marks.length).toFixed(2) : 0;
    const percentage = totalPossible > 0 ? ((totalMarks / totalPossible) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        marks,
        summary: {
          totalSubjects: marks.length,
          totalMarks: parseFloat(totalMarks.toFixed(2)),
          average: parseFloat(average),
          percentage: parseFloat(percentage)
        }
      }
    });
  } catch (error) {
    console.error('Get student results error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getMarks,
  getMarksByExam,
  createMarks,
  updateMark,
  deleteMark,
  getStudentResults
};