const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAcademicYears,
  getAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear
} = require('../controllers/academicYear.controller');

router.use(protect);

router.get('/', getAcademicYears);
router.get('/:id', getAcademicYear);
router.post('/', createAcademicYear);
router.put('/:id', updateAcademicYear);
router.delete('/:id', deleteAcademicYear);

module.exports = router;