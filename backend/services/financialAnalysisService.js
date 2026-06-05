const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Udhari = require('../models/Udhari');
const Goal = require('../models/Goal');

const calculateHealthScore = async (userId) => {
  const [incomes, expenses, udharis, goals] = await Promise.all([
    Income.find({ user: userId }),
    Expense.find({ user: userId }),
    Udhari.find({ user: userId }),
    Goal.find({ user: userId })
  ]);

  let score = 100;
  let insights = [];
  let recommendations = [];

  // 1. Savings Discipline (40 points)
  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  if (savingsRate < 10) { score -= 25; recommendations.push("Critically low savings rate. Aim to save at least 20% of your income."); }
  else if (savingsRate < 20) { score -= 10; insights.push("Your savings rate is decent, but can be optimized."); }
  else { insights.push(`Excellent savings discipline! You are saving ${savingsRate.toFixed(1)}% of your income.`); }

  // 2. Goal Progress (30 points)
  const activeGoals = goals.filter(g => !g.isCompleted);
  if (activeGoals.length > 0) {
    const totalGoalTarget = activeGoals.reduce((acc, g) => acc + g.targetAmount, 0);
    const totalGoalSaved = activeGoals.reduce((acc, g) => acc + g.currentAmount, 0);
    const goalProgress = (totalGoalSaved / totalGoalTarget) * 100;
    
    if (goalProgress < 20) { score -= 15; recommendations.push("Your goal progress is lagging. Consider re-allocating some entertainment budget to goals."); }
    else { insights.push(`You are ${goalProgress.toFixed(1)}% towards completing your active goals.`); }
  }

  // 3. Udhari Risk (30 points)
  const pendingPayables = udharis.filter(u => !u.isSettled && u.type === 'Dene Wale').reduce((acc, u) => acc + u.amount, 0);
  const pendingReceivables = udharis.filter(u => !u.isSettled && u.type === 'Lene Wale').reduce((acc, u) => acc + u.amount, 0);
  
  if (pendingPayables > (totalIncome * 0.3)) { 
    score -= 20; 
    recommendations.push("High debt risk detected. Your pending payables exceed 30% of your total historical income."); 
  }
  if (pendingReceivables > 0) {
    insights.push(`You have ₹${pendingReceivables.toLocaleString()} stuck in pending receivables. Send reminders via the Udhari tab.`);
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    metrics: { savingsRate, pendingPayables, pendingReceivables },
    insights,
    recommendations
  };
};

module.exports = { calculateHealthScore };