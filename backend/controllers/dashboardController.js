const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Udhari = require('../models/Udhari');
const Goal = require('../models/Goal');

// @desc    Get complete dashboard analytics and summary
// @route   GET /api/v1/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = { date: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    }

    // Fetch all user data concurrently for maximum performance
    const [incomes, expenses, udharis, goals] = await Promise.all([
      Income.find({ user: userId, ...dateFilter }),
      Expense.find({ user: userId, ...dateFilter }),
      Udhari.find({ user: userId }),
      Goal.find({ user: userId })
    ]);

    // 1. Calculate Core Totals
    const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalSavings = totalIncome - totalExpense;

    // 2. Calculate Udhari (Credit/Debit) Metrics
    let totalUdhariGiven = 0; // Lene Wale (Receivable)
    let totalUdhariTaken = 0; // Dene Wale (Payable)

    udharis.forEach(record => {
      if (!record.isSettled) {
        if (record.type === 'Lene Wale') totalUdhariGiven += record.amount;
        if (record.type === 'Dene Wale') totalUdhariTaken += record.amount;
      }
    });

    // 3. Calculate Goals Metrics
    const activeGoals = goals.filter(g => !g.isCompleted).length;
    let totalGoalTarget = 0;
    let totalGoalCurrent = 0;
    goals.forEach(g => {
      totalGoalTarget += g.targetAmount;
      totalGoalCurrent += g.currentAmount;
    });
    const overallGoalCompletionPercentage = totalGoalTarget === 0 ? 0 : ((totalGoalCurrent / totalGoalTarget) * 100).toFixed(2);

    // 4. Expense Category Breakdown (For Pie/Doughnut Charts)
    const expenseByCategory = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

    // 5. Monthly Trend Analysis (For Bar/Area Charts) - Last 6 Months
    const monthlyData = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trendIncomes = await Income.find({ user: userId, date: { $gte: sixMonthsAgo } });
    const trendExpenses = await Expense.find({ user: userId, date: { $gte: sixMonthsAgo } });

    trendIncomes.forEach(inc => {
      const monthYear = inc.date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData[monthYear]) monthlyData[monthYear] = { income: 0, expense: 0, label: monthYear };
      monthlyData[monthYear].income += inc.amount;
    });

    trendExpenses.forEach(exp => {
      const monthYear = exp.date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData[monthYear]) monthlyData[monthYear] = { income: 0, expense: 0, label: monthYear };
      monthlyData[monthYear].expense += exp.amount;
    });

    res.status(200).json({
      success: true,
      data: {
        cards: {
          totalIncome,
          totalExpense,
          totalSavings,
          totalUdhariGiven,
          totalUdhariTaken,
          activeGoals,
          overallGoalCompletionPercentage
        },
        charts: {
          expenseByCategory,
          monthlyTrend: Object.values(monthlyData).sort((a, b) => new Date(a.label) - new Date(b.label))
        },
        recentTransactions: {
          incomes: incomes.sort((a, b) => b.date - a.date).slice(0, 5),
          expenses: expenses.sort((a, b) => b.date - a.date).slice(0, 5)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardSummary };