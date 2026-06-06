const express = require('express');
const router = express.Router();
const { createEmi, getEmis, recordPayment, deleteEmi } = require('../controllers/emiController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createEmi).get(protect, getEmis);
router.route('/:id/pay').post(protect, recordPayment);
router.route('/:id').delete(protect, deleteEmi);

module.exports = router;