const { Exam, Subject, Class, AcademicYear, Mark } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
const getExams = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { search, class_id, subject_id, status } = req.query;

    const where = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (class_id) where.class_id = class_id;
    if (subject_id) where.subject_id = subject_id;
    if (status) where.status = status;

    const { count, rows } = await Exam.findAndCountAll({
      where,
      include: [
        { model: Subject, as: 'Subject', attributes: ['id', 'name', 'code'] },
        { model: Class, as: 'Class', attributes: ['id', 'name', 'code'] }
      ],
      order: [['exam_date', 'DESC']],
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
    console.error('Get exams error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
const getExam = async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id, {
      include: [
        { model: Subject, as: 'Subject' },
        { model: Class, as: 'Class' },
        { model: Mark, as: 'Marks' }
      ]
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json({ success: true, data: exam });
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create exam
// @route   POST /api/exams
// @access  Private
const createExam = async (req, res) => {
  try {
    const {
      name, academic_year_id, class_id, subject_id,
      exam_date, start_time, end_time, room, total_marks, pass_marks
    } = req.body;

    const exam = await Exam.create({
      name,
      academic_year_id,
      class_id,
      subject_id,
      exam_date,
      start_time,
      end_time,
      room,
      total_marks,
      pass_marks
    });

    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private
const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    await exam.update(req.body);

    res.json({ success: true, data: exam });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    await exam.destroy();

    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam
};