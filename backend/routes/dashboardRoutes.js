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

    // 4. Calculate Udhari Market Metrics (Live calculation from DB)
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
    const pendingAmount = totalReceivable + totalPayable; 

    // 5. Calculate EMI Metrics (Live calculation from DB)
    let totalActiveEmis = 0;
    let monthlyEmiBurden = 0;

    if (EMI) {
      const activeEmis = await EMI.find({ user: userId, status: 'Active' });
      totalActiveEmis = activeEmis.length;
      activeEmis.forEach(emi => {
        monthlyEmiBurden += emi.emiAmount;
      });
    }

    // ========================================================
    // 6. REAL CHART DATA CALCULATIONS (Fix for broken graphs)
    // ========================================================

    // A. Cash Flow Trend (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0,0,0,0);

    const incomeTrend = await Income.aggregate([
      { $match: { user: userId, date: { $gte: sixMonthsAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          total: { $sum: "$amount" }
      }}
    ]);

    const expenseTrend = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: sixMonthsAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          total: { $sum: "$amount" }
      }}
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrend = [];
    
    // Generate exactly last 6 months array
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = monthNames[d.getMonth()];
      
      monthlyTrend.push({
        monthStr, 
        name: monthLabel,    // Recharts uses 'name' for X-axis
        month: monthLabel,   // Fallback key
        income: 0,
        expense: 0
      });
    }

    // Fill actual data into the array
    incomeTrend.forEach(item => {
      const idx = monthlyTrend.findIndex(m => m.monthStr === item._id);
      if(idx !== -1) monthlyTrend[idx].income = item.total;
    });

    expenseTrend.forEach(item => {
      const idx = monthlyTrend.findIndex(m => m.monthStr === item._id);
      if(idx !== -1) monthlyTrend[idx].expense = item.total;
    });

    // B. Expense Breakdown (Category wise pie chart)
    const expenseByCategoryData = await Expense.aggregate([
      { $match: dateFilter },
      { $group: {
          _id: "$category",
          amount: { $sum: "$amount" }
      }},
      { $sort: { amount: -1 } }
    ]);

    // Format specially for Recharts PieChart (Requires 'name' and 'value')
    const expenseByCategory = expenseByCategoryData.map(item => ({
        name: item._id || 'Other',
        category: item._id || 'Other',
        value: item.amount,
        amount: item.amount
    }));

    // ========================================================
    // 7. SEND FINAL RESPONSE
    // ========================================================
    res.json({
      success: true,
      data: {
        cards: {
          totalIncome,
          totalExpenses,
          udhariMetrics: { pendingAmount, totalReceivable, totalPayable },
          emiMetrics: { totalActive: totalActiveEmis, monthlyBurden: monthlyEmiBurden }
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