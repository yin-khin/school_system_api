const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  deleteStudentPhoto,
  getStudentsByClass
} = require('../controllers/student.controller');

router.use(protect);

router.get('/', getStudents);
router.get('/class/:classId', getStudentsByClass);
router.get('/:id', getStudent);
router.post('/', upload.single('photo'), createStudent);
router.put('/:id', upload.single('photo'), updateStudent);
router.delete('/:id/photo', deleteStudentPhoto);
router.delete('/:id', deleteStudent);

module.exports = router;