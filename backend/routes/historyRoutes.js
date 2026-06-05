const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/multer'); // Aapka photo upload middleware (ya jo bhi path ho)
const HistoryLog = require('../models/HistoryLog');

// Get history logs for a specific item
router.get('/:moduleType/:recordId', protect, async (req, res) => {
    try {
        const logs = await HistoryLog.find({ user: req.user._id, moduleType: req.params.moduleType, recordId: req.params.recordId }).sort({ date: -1 });
        res.json({ success: true, data: logs });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Add new detailed history record with receipt
router.post('/', protect, upload.single('receiptImage'), async (req, res) => {
    try {
        const { moduleType, recordId, actionType, amount, date, note } = req.body;
        const receiptImage = req.file ? req.file.path : '';
        
        const log = await HistoryLog.create({
            user: req.user._id, moduleType, recordId, actionType, amount: Number(amount), date: date || Date.now(), note, receiptImage
        });
        res.status(201).json({ success: true, data: log });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Delete specific history record
router.delete('/:id', protect, async (req, res) => {
    try {
        await HistoryLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        res.json({ success: true, message: 'Record deleted completely' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;