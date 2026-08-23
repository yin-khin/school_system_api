const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const uploadImage = require('../middleware/uploadImage');
const {
  getParents,
  getParent,
  createParent,
  updateParent,
  deleteParent,
  deleteParentPhoto
} = require('../controllers/parent.controller');

router.use(protect);

router.get('/', getParents);
router.get('/:id', getParent);
router.post('/', uploadImage.single('photo'), createParent);
router.put('/:id', uploadImage.single('photo'), updateParent);
router.delete('/:id/photo', deleteParentPhoto);
router.delete('/:id', deleteParent);

module.exports = router;