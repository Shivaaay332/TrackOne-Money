const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

const Expense = mongoose.models.Expense || require('../models/Expense');
const Income = mongoose.models.Income || require('../models/Income');
const Udhari = mongoose.models.Udhari || require('../models/Udhari');
const EMI = mongoose.models.Emi || mongoose.models.EMI || require('../models/Emi');
const { parseLocalDate } = require('../utils/dateHelpers');

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatMonthLabel = (date, showYear) => {
  const label = monthNames[date.getMonth()];
  return showYear ? `${label} '${String(date.getFullYear()).slice(-2)}` : label;
};

router.get('/summary', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, period } = req.query;

    let dateFilter = { user: userId };
    let trendStartDate;
    let trendEndDate = new Date();
    trendEndDate.setHours(23, 59, 59, 999);
    let granularity = 'month';

    if (startDate && endDate) {
      const start = parseLocalDate(startDate, false);
      const end = parseLocalDate(endDate, true);
      dateFilter.date = { $gte: start, $lte: end };
      trendStartDate = start;
      trendEndDate = end;
      granularity = period === 'month' ? 'day' : 'month';
    } else {
      granularity = 'month';
      const [earliestIncome, earliestExpense] = await Promise.all([
        Income.findOne({ user: userId }).sort({ date: 1 }).select('date').lean(),
        Expense.findOne({ user: userId }).sort({ date: 1 }).select('date').lean(),
      ]);

      const dates = [earliestIncome?.date, earliestExpense?.date].filter(Boolean);
      if (dates.length > 0) {
        trendStartDate = new Date(Math.min(...dates.map((d) => new Date(d).getTime())));
        trendStartDate.setHours(0, 0, 0, 0);
      } else {
        trendStartDate = new Date();
        trendStartDate.setMonth(trendStartDate.getMonth() - 5);
        trendStartDate.setDate(1);
        trendStartDate.setHours(0, 0, 0, 0);
      }
    }

    const [incomeData, expenseData, incomeCount, expenseCount] = await Promise.all([
      Income.aggregate([{ $match: dateFilter }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: dateFilter }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Income.countDocuments(dateFilter),
      Expense.countDocuments(dateFilter),
    ]);

    const totalIncome = incomeData[0]?.total || 0;
    const totalExpenses = expenseData[0]?.total || 0;

    const udhariRecords = await Udhari.find({ user: userId, isSettled: false });
    let totalReceivable = 0;
    let totalPayable = 0;
    udhariRecords.forEach((record) => {
      if (record.type === 'Lene Wale') totalReceivable += record.amount;
      else if (record.type === 'Dene Wale') totalPayable += record.amount;
    });
    const pendingAmount = totalReceivable + totalPayable;

    let totalActiveEmis = 0;
    let monthlyEmiBurden = 0;
    if (EMI) {
      const activeEmis = await EMI.find({ user: userId, status: 'Active' });
      totalActiveEmis = activeEmis.length;
      activeEmis.forEach((emi) => { monthlyEmiBurden += emi.emiAmount; });
    }

    const trendMatch = { user: userId, date: { $gte: trendStartDate, $lte: trendEndDate } };
    const dateFormat = granularity === 'day' ? '%Y-%m-%d' : '%Y-%m';

    const [incomeTrend, expenseTrend] = await Promise.all([
      Income.aggregate([
        { $match: trendMatch },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$date' } }, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: trendMatch },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$date' } }, total: { $sum: '$amount' } } },
      ]),
    ]);

    const monthlyTrend = [];
    const spanYears =
      trendStartDate.getFullYear() !== trendEndDate.getFullYear() ||
      (!startDate && granularity === 'month');

    if (granularity === 'day') {
      const cursor = new Date(trendStartDate);
      while (cursor <= trendEndDate) {
        const dayStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        monthlyTrend.push({
          monthStr: dayStr,
          name: String(cursor.getDate()),
          month: String(cursor.getDate()),
          income: 0,
          expense: 0,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      const cursor = new Date(trendStartDate);
      cursor.setDate(1);
      cursor.setHours(0, 0, 0, 0);
      const endMonth = new Date(trendEndDate);
      endMonth.setDate(1);
      endMonth.setHours(0, 0, 0, 0);

      while (cursor <= endMonth) {
        const monthStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        const label = formatMonthLabel(cursor, spanYears);
        monthlyTrend.push({ monthStr, name: label, month: label, income: 0, expense: 0 });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    incomeTrend.forEach((item) => {
      const idx = monthlyTrend.findIndex((m) => m.monthStr === item._id);
      if (idx !== -1) monthlyTrend[idx].income = item.total;
    });
    expenseTrend.forEach((item) => {
      const idx = monthlyTrend.findIndex((m) => m.monthStr === item._id);
      if (idx !== -1) monthlyTrend[idx].expense = item.total;
    });

    const expenseByCategoryData = await Expense.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$category', amount: { $sum: '$amount' } } },
      { $sort: { amount: -1 } },
    ]);

    const expenseByCategory = expenseByCategoryData.map((item) => ({
      name: item._id || 'Other',
      category: item._id || 'Other',
      value: item.amount,
      amount: item.amount,
    }));

    res.json({
      success: true,
      data: {
        meta: {
          period: period || (startDate ? 'custom' : 'all'),
          granularity,
          startDate: trendStartDate,
          endDate: trendEndDate,
        },
        cards: {
          totalIncome,
          totalExpenses,
          incomeCount,
          expenseCount,
          udhariMetrics: { pendingAmount, totalReceivable, totalPayable },
          emiMetrics: { totalActive: totalActiveEmis, monthlyBurden: monthlyEmiBurden },
        },
        charts: { monthlyTrend, expenseByCategory },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
