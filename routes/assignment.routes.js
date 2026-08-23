const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment
} = require('../controllers/assignment.controller');

router.use(protect);

router.get('/', getAssignments);
router.get('/:id', getAssignment);
router.post('/', upload.single('attachment'), createAssignment);
router.put('/:id', upload.single('attachment'), updateAssignment);
router.delete('/:id', deleteAssignment);

module.exports = router;