const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// Route to fetch dashboard summary (including EMI data)
router.get('/summary', protect, getDashboardSummary);

module.exports = router;