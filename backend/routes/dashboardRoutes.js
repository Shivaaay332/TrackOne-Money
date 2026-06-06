const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

const Expense = mongoose.models.Expense || require('../models/Expense');
const Income = mongoose.models.Income || require('../models/Income');
const Udhari = mongoose.models.Udhari || require('../models/Udhari');
const EMI = mongoose.models.Emi || mongoose.models.EMI || require('../models/Emi');
const Goal = mongoose.models.Goal || require('../models/Goal');

router.get('/summary', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    let dateFilter = { user: userId };
    if (startDate && endDate) {
      dateFilter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const incomeData = await Income.aggregate([{ $match: dateFilter }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    const totalIncome = incomeData[0]?.total || 0;

    const expenseData = await Expense.aggregate([{ $match: dateFilter }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    const totalExpenses = expenseData[0]?.total || 0;

    const udhariRecords = await Udhari.find({ user: userId, isSettled: false });
    let totalReceivable = 0, totalPayable = 0;
    udhariRecords.forEach(record => {
      if (record.type === 'Lene Wale') totalReceivable += record.amount;
      else if (record.type === 'Dene Wale') totalPayable += record.amount;
    });
    const pendingAmount = totalReceivable + totalPayable; 

    let totalActiveEmis = 0, monthlyEmiBurden = 0, totalEmiOutstanding = 0;
    if (EMI) {
      const activeEmis = await EMI.find({ user: userId, status: 'Active' });
      totalActiveEmis = activeEmis.length;
      activeEmis.forEach(emi => {
        monthlyEmiBurden += (emi.emiAmount || 0);
        const tenure = emi.tenureMonths || 0;
        const paid = emi.paidInstallments || 0;
        const remaining = Math.max(0, tenure - paid);
        totalEmiOutstanding += (remaining * (emi.emiAmount || 0));
      });
    }

    let totalGoalTarget = 0, totalGoalSaved = 0;
    if (Goal) {
      const goals = await Goal.find({ user: userId });
      goals.forEach(g => {
        totalGoalTarget += (g.targetAmount || g.target || g.goalAmount || 0);
        totalGoalSaved += (g.savedAmount || g.saved || g.currentAmount || 0);
      });
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0,0,0,0);

    const incomeTrend = await Income.aggregate([
      { $match: { user: userId, date: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, total: { $sum: "$amount" } } }
    ]);

    const expenseTrend = await Expense.aggregate([
      { $match: { user: userId, date: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, total: { $sum: "$amount" } } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = monthNames[d.getMonth()];
      monthlyTrend.push({ monthStr, name: monthLabel, month: monthLabel, income: 0, expense: 0 });
    }

    incomeTrend.forEach(item => { const idx = monthlyTrend.findIndex(m => m.monthStr === item._id); if(idx !== -1) monthlyTrend[idx].income = item.total; });
    expenseTrend.forEach(item => { const idx = monthlyTrend.findIndex(m => m.monthStr === item._id); if(idx !== -1) monthlyTrend[idx].expense = item.total; });

    const expenseByCategoryData = await Expense.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      { $sort: { amount: -1 } }
    ]);
    const expenseByCategory = expenseByCategoryData.map(item => ({ name: item._id || 'Other', category: item._id || 'Other', value: item.amount, amount: item.amount }));

    res.json({
      success: true,
      data: {
        cards: {
          totalIncome, totalExpenses,
          udhariMetrics: { pendingAmount, totalReceivable, totalPayable },
          emiMetrics: { totalActive: totalActiveEmis, monthlyBurden: monthlyEmiBurden, totalOutstanding: totalEmiOutstanding },
          goalMetrics: { totalTarget: totalGoalTarget, totalSaved: totalGoalSaved }
        },
        charts: { monthlyTrend, expenseByCategory }
      }
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;