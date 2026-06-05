const express = require('express');
const router = express.Router();
const { getAiDashboardData, chatWithAi, quickTransactionEntry } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getAiDashboardData);
router.post('/chat', protect, chatWithAi);
router.post('/quick-entry', protect, quickTransactionEntry);

module.exports = router;