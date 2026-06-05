const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Udhari = require('../models/Udhari');
const Goal = require('../models/Goal');
const Emi = require('../models/Emi'); 

const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    if (startDate && endDate) { 
      dateFilter = { date: { $gte: new Date(startDate), $lte: new Date(endDate) } }; 
    }

    const [incomes, expenses, udharis, goals, emis] = await Promise.all([
      Income.find({ user: userId, ...dateFilter }),
      Expense.find({ user: userId, ...dateFilter }),
      Udhari.find({ user: userId }),
      Goal.find({ user: userId }),
      Emi.find({ user: userId, status: { $ne: 'Closed' } }) 
    ]);

    const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalSavings = totalIncome - totalExpense;

    let totalUdhariGiven = 0, totalUdhariTaken = 0;
    udharis.forEach(r => { 
      if (!r.isSettled) { 
        r.type === 'Lene Wale' ? totalUdhariGiven += r.amount : totalUdhariTaken += r.amount; 
      } 
    });

    const activeGoals = goals.filter(g => !g.isCompleted).length;
    let totalGoalTarget = 0, totalGoalCurrent = 0;
    goals.forEach(g => { 
      totalGoalTarget += g.targetAmount; 
      totalGoalCurrent += g.currentAmount; 
    });
    const overallGoalCompletionPercentage = totalGoalTarget === 0 ? 0 : ((totalGoalCurrent / totalGoalTarget) * 100).toFixed(2);

    // Calculate Monthly EMI Burden
    let monthlyEmiBurden = 0;
    emis.forEach(e => monthlyEmiBurden += e.emiAmount);

    const expenseByCategory = expenses.reduce((acc, curr) => { 
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount; 
      return acc; 
    }, {});

    const monthlyData = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const trendIncomes = await Income.find({ user: userId, date: { $gte: sixMonthsAgo } });
    const trendExpenses = await Expense.find({ user: userId, date: { $gte: sixMonthsAgo } });

    trendIncomes.forEach(inc => { 
      const m = inc.date.toLocaleString('default', { month: 'short', year: 'numeric' }); 
      if (!monthlyData[m]) monthlyData[m] = { income: 0, expense: 0, label: m }; 
      monthlyData[m].income += inc.amount; 
    });
    
    trendExpenses.forEach(exp => { 
      const m = exp.date.toLocaleString('default', { month: 'short', year: 'numeric' }); 
      if (!monthlyData[m]) monthlyData[m] = { income: 0, expense: 0, label: m }; 
      monthlyData[m].expense += exp.amount; 
    });

    res.status(200).json({
      success: true,
      data: {
        cards: { totalIncome, totalExpense, totalSavings, totalUdhariGiven, totalUdhariTaken, activeGoals, overallGoalCompletionPercentage, monthlyEmiBurden },
        charts: { expenseByCategory, monthlyTrend: Object.values(monthlyData).sort((a, b) => new Date(a.label) - new Date(b.label)) },
        recentTransactions: { 
          incomes: incomes.sort((a, b) => b.date - a.date).slice(0, 5), 
          expenses: expenses.sort((a, b) => b.date - a.date).slice(0, 5), 
          activeEmis: emis 
        }
      }
    });
  } catch (error) { 
    next(error); 
  }
};

module.exports = { getDashboardSummary };