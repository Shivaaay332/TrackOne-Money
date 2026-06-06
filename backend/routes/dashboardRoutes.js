const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// Saare Models ko safely import karein
const Expense = mongoose.models.Expense || require('../models/Expense');
const Income = mongoose.models.Income || require('../models/Income');
const Udhari = mongoose.models.Udhari || require('../models/Udhari');
const EMI = mongoose.models.Emi || mongoose.models.EMI || require('../models/Emi');

router.get('/summary', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    // 1. Date Filter Settings for Income & Expenses
    let dateFilter = { user: userId };
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // 2. Calculate Total Income
    const incomeData = await Income.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalIncome = incomeData[0]?.total || 0;

    // 3. Calculate Total Expenses
    const expenseData = await Expense.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalExpenses = expenseData[0]?.total || 0;

    // 4. FIX: Calculate Udhari Market Metrics (Live calculation from DB)
    const udhariRecords = await Udhari.find({ user: userId, isSettled: false });
    let totalReceivable = 0;
    let totalPayable = 0;

    udhariRecords.forEach(record => {
      if (record.type === 'Lene Wale') {
        totalReceivable += record.amount;
      } else if (record.type === 'Dene Wale') {
        totalPayable += record.amount;
      }
    });
    // Pending Amount = Kitna market mein total fasa hai
    const pendingAmount = totalReceivable + totalPayable; 

    // 5. FIX: Calculate EMI Metrics (Live calculation from DB)
    let totalActiveEmis = 0;
    let monthlyEmiBurden = 0;

    if (EMI) {
      const activeEmis = await EMI.find({ user: userId, status: 'Active' });
      totalActiveEmis = activeEmis.length;
      activeEmis.forEach(emi => {
        monthlyEmiBurden += emi.emiAmount;
      });
    }

    // 6. Dummy Chart Data (Agar aapka charts collection alag hai toh use bhej sakte hain)
    // Yeh structures aapke AnalyticsCharts.jsx ko crash hone se bachayenge
    const monthlyTrend = [
      { month: 'Jan', income: totalIncome * 0.2, expense: totalExpenses * 0.2 },
      { month: 'Feb', income: totalIncome * 0.3, expense: totalExpenses * 0.4 },
      { month: 'Current', income: totalIncome, expense: totalExpenses }
    ];

    const expenseByCategory = [
      { category: 'Food', amount: totalExpenses * 0.4 },
      { category: 'Rent', amount: totalExpenses * 0.3 },
      { category: 'Others', amount: totalExpenses * 0.3 }
    ];

    // Response object sending exact structure required by frontend StatCards
    res.json({
      success: true,
      data: {
        cards: {
          totalIncome,
          totalExpenses,
          udhariMetrics: {
            pendingAmount,
            totalReceivable,
            totalPayable
          },
          emiMetrics: {
            totalActive: totalActiveEmis,
            monthlyBurden: monthlyEmiBurden
          }
        },
        charts: {
          monthlyTrend,
          expenseByCategory
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;