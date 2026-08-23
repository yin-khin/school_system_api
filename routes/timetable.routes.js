const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTimetables,
  getTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable
} = require('../controllers/timetable.controller');

router.use(protect);

router.get('/', getTimetables);
router.get('/:id', getTimetable);
router.post('/', createTimetable);
router.put('/:id', updateTimetable);
router.delete('/:id', deleteTimetable);

module.exports = router;