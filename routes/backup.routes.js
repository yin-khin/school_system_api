const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { exportData, importData } = require('../controllers/backup.controller');

// Export and import routes (admin only)
router.use(protect);
router.use(authorize('super_admin', 'admin'));

// Export all data
router.get('/export', exportData);

// Import data from backup
router.post('/import', importData);

module.exports = router;