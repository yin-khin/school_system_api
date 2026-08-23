const { Subject, Teacher, Class } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const classId = req.query.class_id;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (classId) where.class_id = classId;

    const { count, rows } = await Subject.findAndCountAll({
      where,
      include: [
        { model: Teacher, as: 'Teacher', attributes: ['id', 'first_name', 'last_name'] },
        { model: Class, as: 'Class', attributes: ['id', 'name', 'code'] }
      ],
      order: [['name', 'ASC']],
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
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id, {
      include: [
        { model: Teacher, as: 'Teacher' },
        { model: Class, as: 'Class' }
      ]
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json({ success: true, data: subject });
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private
const createSubject = async (req, res) => {
  try {
    const { name, code, description, teacher_id, class_id, credit } = req.body;

    const subject = await Subject.create({
      name,
      code,
      description,
      teacher_id,
      class_id,
      credit
    });

    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private
const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    await subject.update(req.body);

    res.json({ success: true, data: subject });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByPk(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    await subject.destroy();

    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject
};