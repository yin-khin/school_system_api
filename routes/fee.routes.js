const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getFees,
  getFee,
  createFee,
  updateFee,
  deleteFee,
  getPayments,
  createPayment,
  getFeeSummary
} = require('../controllers/fee.controller');

router.use(protect);

router.get('/', getFees);
router.get('/summary', getFeeSummary);
router.get('/payments', getPayments);
router.get('/:id', getFee);
router.post('/', createFee);
router.post('/payments', createPayment);
router.put('/:id', updateFee);
router.delete('/:id', deleteFee);

module.exports = router;