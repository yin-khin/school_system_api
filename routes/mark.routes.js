const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMarks,
  getMarksByExam,
  createMarks,
  updateMark,
  deleteMark,
  getStudentResults
} = require('../controllers/mark.controller');

router.use(protect);

router.get('/', getMarks);
router.get('/exam/:examId', getMarksByExam);
router.get('/student/:studentId/results', getStudentResults);
router.post('/', createMarks);
router.put('/:id', updateMark);
router.delete('/:id', deleteMark);

module.exports = router;