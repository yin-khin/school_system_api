const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const uploadImage = require('../middleware/uploadImage');
const {
  getStaffs,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  deleteStaffPhoto
} = require('../controllers/staff.controller');

router.use(protect);

router.get('/', getStaffs);
router.get('/:id', getStaff);
router.post('/', uploadImage.single('photo'), createStaff);
router.put('/:id', uploadImage.single('photo'), updateStaff);
router.delete('/:id/photo', deleteStaffPhoto);
router.delete('/:id', deleteStaff);

module.exports = router;