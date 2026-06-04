const express = require('express');
const router = express.Router();
const { addExpense, getExpenses, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, upload.single('receipt'), addExpense)
  .get(protect, getExpenses);

router.route('/:id')
  .put(protect, upload.single('receipt'), updateExpense)
  .delete(protect, deleteExpense);

module.exports = router;