const { Book, LibraryTransaction, Student } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// @desc    Get all books
// @route   GET /api/library/books
// @access  Private
const getBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category;

    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { author: { [Op.iLike]: `%${search}%` } },
        { isbn: { [Op.iLike]: `%${search}%` } },
        { book_id: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (category) where.category = category;

    const { count, rows } = await Book.findAndCountAll({
      where,
      order: [['title', 'ASC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single book
// @route   GET /api/library/books/:id
// @access  Private
const getBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({ success: true, data: book });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create book
// @route   POST /api/library/books
// @access  Private
const createBook = async (req, res) => {
  try {
    const { isbn, title, author, category, publisher, quantity, location } = req.body;

    // Generate book ID
    const count = await Book.count();
    const bookId = `BK-${String(count + 1).padStart(4, '0')}`;

    const book = await Book.create({
      book_id: bookId,
      isbn,
      title,
      author,
      category,
      publisher,
      quantity: quantity || 1,
      available: quantity || 1,
      location,
      photo: req.file ? req.file.filename : null
    });

    res.status(201).json({ success: true, data: book });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update book
// @route   PUT /api/library/books/:id
// @access  Private
const updateBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const updateData = { ...req.body };
    // Remove photo if not a string (frontend may send empty object)
    if (updateData.photo != null && typeof updateData.photo !== 'string') {
      delete updateData.photo;
    }
    if (req.file) {
      // Delete old photo if exists
      if (book.photo) {
        const oldPhotoPath = path.join(__dirname, '../uploads', book.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      updateData.photo = req.file.filename;
    }

    await book.update(updateData);

    res.json({ success: true, data: book });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete book
// @route   DELETE /api/library/books/:id
// @access  Private
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Delete photo file if exists
    if (book.photo) {
      const photoPath = path.join(__dirname, '../uploads', book.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await book.destroy();

    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all transactions
// @route   GET /api/library/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, student_id } = req.query;

    const where = {};
    if (status) where.status = status;
    if (student_id) where.student_id = student_id;

    const { count, rows } = await LibraryTransaction.findAndCountAll({
      where,
      include: [
        { model: Book, as: 'Book', attributes: ['id', 'book_id', 'title', 'author'] },
        { model: Student, as: 'Student', attributes: ['id', 'student_id', 'first_name', 'last_name'] }
      ],
      order: [['issue_date', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Issue book
// @route   POST /api/library/transactions
// @access  Private
const issueBook = async (req, res) => {
  try {
    const { book_id, student_id, issue_date, due_date } = req.body;
    const issuedBy = req.user.id;

    const book = await Book.findByPk(book_id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.available <= 0) {
      return res.status(400).json({ message: 'Book is not available' });
    }

    const transaction = await LibraryTransaction.create({
      book_id,
      student_id,
      issue_date,
      due_date,
      issued_by: issuedBy
    });

    // Update book availability
    await book.update({
      available: book.available - 1,
      status: book.available - 1 <= 0 ? 'borrowed' : 'available'
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Issue book error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Return book
// @route   PUT /api/library/transactions/:id/return
// @access  Private
const returnBook = async (req, res) => {
  try {
    const transaction = await LibraryTransaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const { return_date, fine_amount } = req.body;

    await transaction.update({
      return_date,
      status: 'returned',
      fine_amount: fine_amount || 0
    });

    // Update book availability
    const book = await Book.findByPk(transaction.book_id);
    if (book) {
      await book.update({
        available: book.available + 1,
        status: 'available'
      });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/library/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await LibraryTransaction.findByPk(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await transaction.destroy();

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete book photo
// @route   DELETE /api/library/books/:id/photo
// @access  Private
const deleteBookPhoto = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.photo) {
      const photoPath = path.join(__dirname, '../uploads', book.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await book.update({ photo: null });

    res.json({ success: true, message: 'Photo deleted successfully', data: book });
  } catch (error) {
    console.error('Delete book photo error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
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
};
