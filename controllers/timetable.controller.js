const { Timetable, Class, Subject, Teacher, Section } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all timetables
// @route   GET /api/timetables
// @access  Private
const getTimetables = async (req, res) => {
  try {
    const { class_id, teacher_id, day_of_week } = req.query;

    const where = {};
    if (class_id) where.class_id = class_id;
    if (teacher_id) where.teacher_id = teacher_id;
    if (day_of_week) where.day_of_week = day_of_week;

    const timetables = await Timetable.findAll({
      where,
      include: [
        { model: Class, as: 'Class', attributes: ['id', 'name', 'code'] },
        { model: Subject, as: 'Subject', attributes: ['id', 'name', 'code'] },
        { model: Teacher, as: 'Teacher', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
    });

    res.json({ success: true, data: timetables });
  } catch (error) {
    console.error('Get timetables error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single timetable
// @route   GET /api/timetables/:id
// @access  Private
const getTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByPk(req.params.id, {
      include: [
        { model: Class, as: 'Class' },
        { model: Subject, as: 'Subject' },
        { model: Teacher, as: 'Teacher' }
      ]
    });

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    res.json({ success: true, data: timetable });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create timetable
// @route   POST /api/timetables
// @access  Private
const createTimetable = async (req, res) => {
  try {
    const { class_id, section_id, subject_id, teacher_id, day_of_week, start_time, end_time, room } = req.body;

    const timetable = await Timetable.create({
      class_id,
      section_id,
      subject_id,
      teacher_id,
      day_of_week,
      start_time,
      end_time,
      room
    });

    res.status(201).json({ success: true, data: timetable });
  } catch (error) {
    console.error('Create timetable error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update timetable
// @route   PUT /api/timetables/:id
// @access  Private
const updateTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByPk(req.params.id);

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    await timetable.update(req.body);

    res.json({ success: true, data: timetable });
  } catch (error) {
    console.error('Update timetable error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete timetable
// @route   DELETE /api/timetables/:id
// @access  Private
const deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByPk(req.params.id);

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    await timetable.destroy();

    res.json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getTimetables,
  getTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable
};