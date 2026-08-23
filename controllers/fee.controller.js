const { Fee, Payment, Student, Class } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all fees
// @route   GET /api/fees
// @access  Private
const getFees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { student_id, status, fee_type } = req.query;

    const where = {};
    if (student_id) where.student_id = student_id;
    if (status) where.status = status;
    if (fee_type) where.fee_type = fee_type;

    const { count, rows } = await Fee.findAndCountAll({
      where,
      include: [
        { model: Student, as: 'Student', attributes: ['id', 'student_id', 'first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']],
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
    console.error('Get fees error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single fee
// @route   GET /api/fees/:id
// @access  Private
const getFee = async (req, res) => {
  try {
    const fee = await Fee.findByPk(req.params.id, {
      include: [
        { model: Student, as: 'Student' },
        { model: Payment, as: 'Payments' }
      ]
    });

    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    res.json({ success: true, data: fee });
  } catch (error) {
    console.error('Get fee error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create fee
// @route   POST /api/fees
// @access  Private
const createFee = async (req, res) => {
  try {
    const { student_id, fee_type, amount, discount, due_date, description } = req.body;

    // Generate invoice number
    const year = new Date().getFullYear();
    const count = await Fee.count();
    const invoiceNo = `INV-${year}-${String(count + 1).padStart(3, '0')}`;

    const fee = await Fee.create({
      invoice_no: invoiceNo,
      student_id,
      fee_type,
      amount,
      discount: discount || 0,
      due_date,
      description
    });

    res.status(201).json({ success: true, data: fee });
  } catch (error) {
    console.error('Create fee error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update fee
// @route   PUT /api/fees/:id
// @access  Private
const updateFee = async (req, res) => {
  try {
    const fee = await Fee.findByPk(req.params.id);

    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    await fee.update(req.body);

    res.json({ success: true, data: fee });
  } catch (error) {
    console.error('Update fee error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete fee
// @route   DELETE /api/fees/:id
// @access  Private
const deleteFee = async (req, res) => {
  try {
    const fee = await Fee.findByPk(req.params.id);

    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    await fee.destroy();

    res.json({ success: true, message: 'Fee deleted successfully' });
  } catch (error) {
    console.error('Delete fee error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all payments
// @route   GET /api/fees/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { student_id, payment_method } = req.query;

    const where = {};
    if (student_id) where.student_id = student_id;
    if (payment_method) where.payment_method = payment_method;

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Student, as: 'Student', attributes: ['id', 'student_id', 'first_name', 'last_name'] },
        { model: Fee, as: 'Fee', attributes: ['id', 'invoice_no', 'fee_type', 'amount'] }
      ],
      order: [['payment_date', 'DESC']],
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
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create payment
// @route   POST /api/fees/payments
// @access  Private
const createPayment = async (req, res) => {
  try {
    const { fee_id, student_id, amount, payment_method, payment_date, remark } = req.body;
    const receivedBy = req.user.id;

    // Generate receipt number
    const year = new Date().getFullYear();
    const count = await Payment.count();
    const receiptNo = `RCP-${year}-${String(count + 1).padStart(3, '0')}`;

    const payment = await Payment.create({
      receipt_no: receiptNo,
      fee_id,
      student_id,
      amount,
      payment_method,
      payment_date,
      received_by: receivedBy,
      remark
    });

    // Update fee status
    const fee = await Fee.findByPk(fee_id);
    if (fee) {
      const newPaidAmount = parseFloat(fee.paid_amount) + parseFloat(amount);
      const totalAmount = parseFloat(fee.amount) - parseFloat(fee.discount);
      
      await fee.update({
        paid_amount: newPaidAmount,
        status: newPaidAmount >= totalAmount ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'pending')
      });
    }

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get fee summary
// @route   GET /api/fees/summary
// @access  Private
const getFeeSummary = async (req, res) => {
  try {
    const totalFees = await Fee.sum('amount');
    const totalPaid = await Fee.sum('paid_amount');
    const totalDiscount = await Fee.sum('discount');
    const pendingFees = await Fee.count({ where: { status: { [Op.in]: ['pending', 'partial', 'overdue'] } } });
    const paidFees = await Fee.count({ where: { status: 'paid' } });

    res.json({
      success: true,
      data: {
        totalFees: totalFees || 0,
        totalPaid: totalPaid || 0,
        totalDiscount: totalDiscount || 0,
        totalOutstanding: (totalFees || 0) - (totalPaid || 0) - (totalDiscount || 0),
        pendingFees,
        paidFees
      }
    });
  } catch (error) {
    console.error('Get fee summary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getFees,
  getFee,
  createFee,
  updateFee,
  deleteFee,
  getPayments,
  createPayment,
  getFeeSummary
};