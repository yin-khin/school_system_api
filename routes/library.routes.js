const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const uploadImage = require('../middleware/uploadImage');
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  deleteBookPhoto,
  getTransactions,
  issueBook,
  returnBook,
  deleteTransaction
} = require('../controllers/library.controller');

router.use(protect);

// Book routes
router.get('/books', getBooks);
router.get('/books/:id', getBook);
router.post('/books', uploadImage.single('photo'), createBook);
router.put('/books/:id', uploadImage.single('photo'), updateBook);
router.delete('/books/:id/photo', deleteBookPhoto);
router.delete('/books/:id', deleteBook);

// Transaction routes
router.get('/transactions', getTransactions);
router.post('/transactions', issueBook);
router.put('/transactions/:id/return', returnBook);
router.delete('/transactions/:id', deleteTransaction);

module.exports = router;