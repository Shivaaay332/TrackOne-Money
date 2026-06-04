const express = require('express');
const router = express.Router();
const { addUdhariRecord, getUdhariRecords, toggleSettlement, deleteUdhariRecord } = require('../controllers/udhariController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, addUdhariRecord)
  .get(protect, getUdhariRecords);

router.route('/:id/settle')
  .patch(protect, toggleSettlement);

router.route('/:id')
  .delete(protect, deleteUdhariRecord);

module.exports = router;