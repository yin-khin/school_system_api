const { Assignment, Subject, Class, Teacher } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all assignments
// @route   GET /api/assignments
// @access  Private
const getAssignments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { class_id, subject_id, teacher_id, status } = req.query;

    const where = {};
    if (class_id) where.class_id = class_id;
    if (subject_id) where.subject_id = subject_id;
    if (teacher_id) where.teacher_id = teacher_id;
    if (status) where.status = status;

    const { count, rows } = await Assignment.findAndCountAll({
      where,
      include: [
        { model: Subject, as: 'Subject', attributes: ['id', 'name', 'code'] },
        { model: Class, as: 'Class', attributes: ['id', 'name', 'code'] },
        { model: Teacher, as: 'Teacher', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['due_date', 'DESC']],
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
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id, {
      include: [
        { model: Subject, as: 'Subject' },
        { model: Class, as: 'Class' },
        { model: Teacher, as: 'Teacher' }
      ]
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ success: true, data: assignment });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create assignment
// @route   POST /api/assignments
// @access  Private
const createAssignment = async (req, res) => {
  try {
    const { title, description, subject_id, class_id, due_date, status } = req.body;

    const assignment = await Assignment.create({
      title,
      description,
      subject_id,
      class_id,
      teacher_id: req.user.id,
      due_date,
      attachment: req.file ? req.file.filename : null,
      status: status || 'active'
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private
const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const updateData = { ...req.body };
    if (req.file) {
      updateData.attachment = req.file.filename;
    }

    await assignment.update(updateData);

    res.json({ success: true, data: assignment });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    await assignment.destroy();

    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment
};