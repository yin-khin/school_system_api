const { Class, Section, Student, Teacher, AcademicYear, Subject } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
const getClasses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const academicYearId = req.query.academic_year_id;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (academicYearId) where.academic_year_id = academicYearId;

    const { count, rows } = await Class.findAndCountAll({
      where,
      include: [
        { model: Section, as: 'Sections' },
        { model: Teacher, as: 'Teacher', attributes: ['id', 'first_name', 'last_name'] },
        { model: Student, as: 'Students', attributes: ['id', 'first_name', 'last_name'] }
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
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single class
// @route   GET /api/classes/:id
// @access  Private
const getClass = async (req, res) => {
  try {
    const classData = await Class.findByPk(req.params.id, {
      include: [
        { model: Section, as: 'Sections' },
        { model: Teacher, as: 'Teacher' },
        { model: Student, as: 'Students' },
        { model: Subject, as: 'Subjects' }
      ]
    });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({ success: true, data: classData });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create class
// @route   POST /api/classes
// @access  Private
const createClass = async (req, res) => {
  try {
    const { name, code, academic_year_id, class_teacher_id, room, capacity, description } = req.body;

    const classData = await Class.create({
      name,
      code,
      academic_year_id,
      class_teacher_id,
      room,
      capacity,
      description
    });

    res.status(201).json({ success: true, data: classData });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private
const updateClass = async (req, res) => {
  try {
    const classData = await Class.findByPk(req.params.id);

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    await classData.update(req.body);

    res.json({ success: true, data: classData });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private
const deleteClass = async (req, res) => {
  try {
    const classData = await Class.findByPk(req.params.id);

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    await classData.destroy();

    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get sections by class
// @route   GET /api/classes/:id/sections
// @access  Private
const getClassSections = async (req, res) => {
  try {
    const sections = await Section.findAll({
      where: { class_id: req.params.id }
    });

    res.json({ success: true, data: sections });
  } catch (error) {
    console.error('Get class sections error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create section
// @route   POST /api/classes/:id/sections
// @access  Private
const createSection = async (req, res) => {
  try {
    const { name, capacity, room } = req.body;

    const section = await Section.create({
      class_id: req.params.id,
      name,
      capacity,
      room
    });

    res.status(201).json({ success: true, data: section });
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update section
// @route   PUT /api/classes/sections/:id
// @access  Private
const updateSection = async (req, res) => {
  try {
    const section = await Section.findByPk(req.params.id);

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    await section.update(req.body);

    res.json({ success: true, data: section });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete section
// @route   DELETE /api/classes/sections/:id
// @access  Private
const deleteSection = async (req, res) => {
  try {
    const section = await Section.findByPk(req.params.id);

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    await section.destroy();

    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassSections,
  createSection,
  updateSection,
  deleteSection
};