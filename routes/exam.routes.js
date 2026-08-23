const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam
} = require('../controllers/exam.controller');

router.use(protect);

router.get('/', getExams);
router.get('/:id', getExam);
router.post('/', createExam);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);

module.exports = router;