const { AcademicYear } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all academic years
// @route   GET /api/academic-years
// @access  Private
const getAcademicYears = async (req, res) => {
  try {
    const academicYears = await AcademicYear.findAll({
      order: [['start_date', 'DESC']]
    });

    res.json({ success: true, data: academicYears });
  } catch (error) {
    console.error('Get academic years error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single academic year
// @route   GET /api/academic-years/:id
// @access  Private
const getAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findByPk(req.params.id);

    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    res.json({ success: true, data: academicYear });
  } catch (error) {
    console.error('Get academic year error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create academic year
// @route   POST /api/academic-years
// @access  Private
const createAcademicYear = async (req, res) => {
  try {
    const { name, start_date, end_date, is_current } = req.body;

    // If setting as current, unset others
    if (is_current) {
      await AcademicYear.update({ is_current: false }, { where: { is_current: true } });
    }

    const academicYear = await AcademicYear.create({
      name,
      start_date,
      end_date,
      is_current: is_current || false
    });

    res.status(201).json({ success: true, data: academicYear });
  } catch (error) {
    console.error('Create academic year error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update academic year
// @route   PUT /api/academic-years/:id
// @access  Private
const updateAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findByPk(req.params.id);

    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    if (req.body.is_current) {
      await AcademicYear.update({ is_current: false }, { where: { is_current: true } });
    }

    await academicYear.update(req.body);

    res.json({ success: true, data: academicYear });
  } catch (error) {
    console.error('Update academic year error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete academic year
// @route   DELETE /api/academic-years/:id
// @access  Private
const deleteAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findByPk(req.params.id);

    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' });
    }

    await academicYear.destroy();

    res.json({ success: true, message: 'Academic year deleted successfully' });
  } catch (error) {
    console.error('Delete academic year error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAcademicYears,
  getAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear
};