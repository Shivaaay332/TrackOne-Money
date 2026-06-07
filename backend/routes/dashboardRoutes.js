const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// Models
const Expense = mongoose.models.Expense || require('../models/Expense');
const Income = mongoose.models.Income || require('../models/Income');
const Udhari = mongoose.models.Udhari || require('../models/Udhari');
const EMI = mongoose.models.Emi || mongoose.models.EMI || require('../models/Emi');

router.get('/summary', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    let dateFilter = { user: userId };
    
    // Default to last 6 months for All Time trend
    let trendStartDate = new Date();
    trendStartDate.setMonth(trendStartDate.getMonth() - 5);
    trendStartDate.setDate(1);
    trendStartDate.setHours(0,0,0,0);
    let trendEndDate = new Date();

    // 🔥 EXACT FILTER APPLIED TO EVERYTHING 🔥
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
      trendStartDate = new Date(startDate);
      trendEndDate = new Date(endDate);
    }

    // Calculate Totals
    const incomeData = await Income.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalIncome = incomeData[0]?.total || 0;

    const expenseData = await Expense.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalExpenses = expenseData[0]?.total || 0;

    // Udhari Metrics (Active Market Status)
    const udhariRecords = await Udhari.find({ user: userId, isSettled: false });
    let totalReceivable = 0; let totalPayable = 0;
    udhariRecords.forEach(record => {
      if (record.type === 'Lene Wale') totalReceivable += record.amount;
      else if (record.type === 'Dene Wale') totalPayable += record.amount;
    });
    const pendingAmount = totalReceivable + totalPayable; 

    // EMI Metrics
    let totalActiveEmis = 0; let monthlyEmiBurden = 0;
    if (EMI) {
      const activeEmis = await EMI.find({ user: userId, status: 'Active' });
      totalActiveEmis = activeEmis.length;
      activeEmis.forEach(emi => { monthlyEmiBurden += emi.emiAmount; });
    }

    // 🔥 DYNAMIC CASH FLOW TREND BASED ON SELECTED PERIOD 🔥
    const incomeTrend = await Income.aggregate([
      { $match: { user: userId, date: { $gte: trendStartDate, $lte: trendEndDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, total: { $sum: "$amount" } } }
    ]);

    const expenseTrend = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: trendStartDate, $lte: trendEndDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, total: { $sum: "$amount" } } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrend = [];
    
    let currentMonth = new Date(trendStartDate);
    currentMonth.setDate(1);
    currentMonth.setHours(0,0,0,0);
    
    let endMonth = new Date(trendEndDate);
    endMonth.setDate(1);
    endMonth.setHours(0,0,0,0);

    // Build perfect month array exactly covering the selected period
    while (currentMonth <= endMonth) {
      const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = monthNames[currentMonth.getMonth()];
      
      monthlyTrend.push({
        monthStr, name: monthLabel, month: monthLabel, income: 0, expense: 0
      });
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    incomeTrend.forEach(item => {
      const idx = monthlyTrend.findIndex(m => m.monthStr === item._id);
      if(idx !== -1) monthlyTrend[idx].income = item.total;
    });
    expenseTrend.forEach(item => {
      const idx = monthlyTrend.findIndex(m => m.monthStr === item._id);
      if(idx !== -1) monthlyTrend[idx].expense = item.total;
    });

    // Dynamic Expense Category Breakdown
    const expenseByCategoryData = await Expense.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      { $sort: { amount: -1 } }
    ]);

    const expenseByCategory = expenseByCategoryData.map(item => ({
        name: item._id || 'Other', category: item._id || 'Other',
        value: item.amount, amount: item.amount
    }));

    res.json({
      success: true,
      data: {
        cards: { totalIncome, totalExpenses, udhariMetrics: { pendingAmount, totalReceivable, totalPayable }, emiMetrics: { totalActive: totalActiveEmis, monthlyBurden: monthlyEmiBurden } },
        charts: { monthlyTrend, expenseByCategory }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;