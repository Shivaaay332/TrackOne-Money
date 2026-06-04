const express = require('express');
const router = express.Router();
const { addIncome, getIncomes, updateIncome, deleteIncome } = require('../controllers/incomeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, upload.single('receipt'), addIncome)
  .get(protect, getIncomes);

router.route('/:id')
  .put(protect, upload.single('receipt'), updateIncome)
  .delete(protect, deleteIncome);

module.exports = router;