const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { createEmi, getEmis, deleteEmi } = require('../controllers/emiController');
const { protect } = require('../middleware/authMiddleware');

// Safely import models
let EMI;
try { EMI = mongoose.models.Emi || require('../models/Emi'); } 
catch(e) { EMI = mongoose.models.EMI || require('../models/EMI'); }
const HistoryLog = mongoose.models.HistoryLog || require('../models/HistoryLog');

router.route('/').post(protect, createEmi).get(protect, getEmis);
router.route('/:id').delete(protect, deleteEmi);

// 🔥 MAGIC: AUTOMATIC EMI PAYMENT LOGIC WITH EXACT DUE DATE 🔥
router.post('/:id/pay', protect, async (req, res) => {
    try {
        const emi = await EMI.findById(req.params.id);
        if (!emi) return res.status(404).json({ success: false, message: 'EMI not found' });

        const amountPaid = req.body.amountPaid || emi.emiAmount;

        // 🔥 FIX: Payment date ab wahi hogi jis din ki EMI thi (Actual Due Date) 🔥
        const actualDueDate = emi.nextDueDate ? new Date(emi.nextDueDate) : new Date();

        // Update EMI Data
        emi.paidInstallments += 1;
        
        // Next Due Date ko exactly 1 Mahina aage badhao
        if (emi.nextDueDate) {
            const nextDate = new Date(emi.nextDueDate);
            nextDate.setMonth(nextDate.getMonth() + 1); 
            emi.nextDueDate = nextDate;
        }

        if (emi.paidInstallments >= emi.tenureMonths) {
            emi.status = 'Closed';
        }

        // Calculate beautiful stats for the History Note
        const remainingEmis = emi.tenureMonths - emi.paidInstallments;
        const progress = ((emi.paidInstallments / emi.tenureMonths) * 100).toFixed(1);

        await emi.save();

        // 🔥 Auto-Generate History Log (Ab yahan exact Due Date aayegi)
        await HistoryLog.create({
            user: req.user._id,
            moduleType: 'EMI',
            recordId: emi._id,
            actionType: 'Paid',
            amount: amountPaid,
            date: actualDueDate, // <-- Ye wahi date hai jis din EMI bharni thi
            note: `Auto-recorded: Installment ${emi.paidInstallments}/${emi.tenureMonths} paid. ${remainingEmis} EMIs remaining. Loan is ${progress}% cleared.`
        });

        res.json({ success: true, message: 'Payment recorded automatically!', data: emi });
    } catch (error) {
        console.error("Auto EMI Pay Error:", error);
        res.status(500).json({ success: false, message: 'Server error while recording payment' });
    }
});

module.exports = router;