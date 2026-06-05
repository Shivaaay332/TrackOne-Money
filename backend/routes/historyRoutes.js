const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/multer');
const HistoryLog = require('../models/HistoryLog');

// Import Parent Models Safely
const Udhari = require('../models/Udhari');
let EMI;
try { EMI = require('../models/Emi'); } catch(e) { EMI = require('../models/EMI'); }

// Get history logs for a specific item
router.get('/:moduleType/:recordId', protect, async (req, res) => {
    try {
        const logs = await HistoryLog.find({ user: req.user._id, moduleType: req.params.moduleType, recordId: req.params.recordId }).sort({ date: -1 });
        res.json({ success: true, data: logs });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Add new detailed history record & UPDATE MAIN BALANCE
router.post('/', protect, upload.single('receiptImage'), async (req, res) => {
    try {
        const { moduleType, recordId, actionType, amount, date, note } = req.body;
        const receiptImage = req.file ? req.file.path : '';
        const numAmount = Number(amount);
        
        const log = await HistoryLog.create({
            user: req.user._id, moduleType, recordId, actionType, amount: numAmount, date: date || Date.now(), note, receiptImage
        });

        // MAGIC: Dynamic Ledger Deduction Logic
        if (moduleType === 'Udhari') {
            const udhari = await Udhari.findById(recordId);
            if (udhari) {
                if (actionType === 'Received' || actionType === 'Paid') {
                    udhari.amount -= numAmount; // Balance kam karo
                } else if (actionType === 'Added') {
                    udhari.amount += numAmount; // Balance badhao
                }
                
                if (udhari.amount <= 0) {
                    udhari.amount = 0;
                    udhari.isSettled = true;
                } else {
                    udhari.isSettled = false;
                }
                await udhari.save();
            }
        } else if (moduleType === 'EMI' && EMI) {
            const emi = await EMI.findById(recordId);
            if (emi && actionType === 'Paid') {
                emi.paidInstallments += 1;
                if (emi.paidInstallments >= emi.tenureMonths) emi.status = 'Closed';
                await emi.save();
            }
        }

        res.status(201).json({ success: true, data: log });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Delete history record & REVERSE MAIN BALANCE
router.delete('/:id', protect, async (req, res) => {
    try {
        const log = await HistoryLog.findOne({ _id: req.params.id, user: req.user._id });
        if (!log) return res.status(404).json({ success: false, message: 'Record not found' });

        // MAGIC: Reverse the deduction
        if (log.moduleType === 'Udhari') {
            const udhari = await Udhari.findById(log.recordId);
            if (udhari) {
                if (log.actionType === 'Received' || log.actionType === 'Paid') {
                    udhari.amount += log.amount; // Wapas jod do
                    udhari.isSettled = false;
                } else if (log.actionType === 'Added') {
                    udhari.amount -= log.amount; // Wapas ghata do
                    if (udhari.amount <= 0) { udhari.amount = 0; udhari.isSettled = true; }
                }
                await udhari.save();
            }
        } else if (log.moduleType === 'EMI' && EMI) {
            const emi = await EMI.findById(log.recordId);
            if (emi && log.actionType === 'Paid') {
                emi.paidInstallments -= 1;
                if (emi.paidInstallments < 0) emi.paidInstallments = 0;
                if (emi.paidInstallments < emi.tenureMonths) emi.status = 'Active';
                await emi.save();
            }
        }

        await log.deleteOne();
        res.json({ success: true, message: 'Record deleted completely' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;