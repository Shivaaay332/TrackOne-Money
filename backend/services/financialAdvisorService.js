const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Udhari = require('../models/Udhari');
const Goal = require('../models/Goal');

const Memory = require('./conversationMemoryService');
const Planner = require('./savingsPlannerService');
const GoalEngine = require('./goalPredictionService');
const Budget = require('./budgetRecommendationService');
const Insights = require('./insightGenerationService');

const formatResponse = (data) => {
  return `### 📊 Current Status\n${data.status}\n\n### 🧠 Analysis\n${data.analysis}\n\n### 💡 Recommendation\n${data.recommendation}\n\n### 🚀 Action Plan\n${data.actionPlan}\n\n*${data.followUp}*`;
};

const processSmartQuery = async (userId, textQuery) => {
  const query = textQuery.toLowerCase();
  const isHinglish = /(kya|kaise|kitna|mera|mujhe|batao|kharcha|bachat|bachao|bacha|karu|ha|hai|ho|raha|chahiye|udhari|lakshya|leni|ji|haan|kardo)/i.test(query);

  const [incomes, expenses, udharis, goals] = await Promise.all([
    Income.find({ user: userId }), Expense.find({ user: userId }),
    Udhari.find({ user: userId, isSettled: false }), Goal.find({ user: userId, isCompleted: false }).sort({ priorityLevel: -1 })
  ]);

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const savings = totalIncome - totalExpense;
  
  const pendingPayables = udharis.filter(u => u.type === 'Dene Wale').reduce((sum, u) => sum + u.amount, 0);
  const pendingReceivables = udharis.filter(u => u.type === 'Lene Wale').reduce((sum, u) => sum + u.amount, 0);

  const expMap = {};
  expenses.forEach(e => { expMap[e.category] = (expMap[e.category] || 0) + e.amount; });
  const topExpenses = Object.keys(expMap).map(k => ({ _id: k, total: expMap[k] })).sort((a,b) => b.total - a.total);

  const userData = { totalIncome, totalExpense, savings, pendingUdhari: pendingReceivables, topExpenses, activeGoals: goals };

  const numberMatch = query.match(/\d+(?:,\d+)*(?:\.\d+)?/);
  const extractedAmount = numberMatch ? parseFloat(numberMatch[0].replace(/,/g, '')) : null;

  const isYes = /^(ha|haan|yes|yep|yup|sure|batao|bataiye|ji|ji haan|please|of course)\b/i.test(query);
  const memory = Memory.getContext(userId);

  if (memory && (query.includes("daily") || query.includes("roz") || query.includes("breakdown") || isYes)) {
    if (memory.lastIntent === 'goal_check' && memory.lastData) {
      const daily = Math.ceil(memory.lastData.remaining / 30);
      Memory.clearContext(userId);
      return `### 📅 Daily Target Breakdown\nApne goal ko 1 mahine mein achieve karne ke liye, aapko **₹${daily} rozana** bachane honge.\n\n*Tip: Faltu kharcho ko aaj se hi track karna shuru karein!*`;
    }
    if (memory.lastIntent === 'savings_plan' && memory.lastData) {
      const daily = Math.ceil(Math.max(0, memory.lastData.shortfall) / 30);
      Memory.clearContext(userId);
      return `### 📅 Daily Savings Plan\nApne target ko hit karne ke liye, aapko **₹${daily} rozana** bachane honge.\n\n*Apne '${topExpenses[0]?._id || 'Food'}' expenses kam karke ye aasaani se kiya ja sakta hai.*`;
    }
    if (memory.lastIntent === 'general_review' || query.includes("budget")) {
      Memory.clearContext(userId);
      return `### 📊 Suggested 50/30/20 Budget\nBased on your income (₹${totalIncome}):\n* **Needs (50%):** ₹${(totalIncome*0.5).toFixed(0)}\n* **Wants (30%):** ₹${(totalIncome*0.3).toFixed(0)}\n* **Savings/Goals (20%):** ₹${(totalIncome*0.2).toFixed(0)}\n\n*Is rule ko follow karne se aapka financial health ekdam strong rahega!*`;
    }
  }

  if (query.includes("add") || query.includes("kardo") || query.includes("daal")) {
    if (query.includes("goal") || query.includes("lakshya")) {
      return `### 🎯 Goal Funding\nMain abhi AI Chat se direct goals mein paise add nahi kar sakta. \n\nPlease app ke **'Future Goals'** section mein jaakar **'Manage Funds'** par click karein.\n\n*Kya aap apne goals ka current progress check karna chahenge?*`;
    }
  }

  if (query.includes("spend") || query.includes("spent") || (query.includes("kharcha") && !query.includes("kam") && !query.includes("bacha"))) {
    return formatResponse({
      status: `Total Income: ₹${totalIncome} | Total Expense: ₹${totalExpense}`,
      analysis: isHinglish ? `Aapne is mahine total **₹${totalExpense}** kharch kiye hain. Sabse zyada **${topExpenses[0]?._id || 'kisi'}** category mein (₹${topExpenses[0]?.total || 0}) gaye hain.` : `You have spent a total of **₹${totalExpense}** this month. Highest spending is on **${topExpenses[0]?._id || 'items'}**.`,
      recommendation: isHinglish ? "Kharcho par dhyaan rakhna achhi aadat hai." : "Keeping track of your expenses is a great habit.",
      actionPlan: isHinglish ? "Transactions tab mein check karein ki kis din sabse zyada kharcha hua." : "Check the Transactions tab to see daily spending patterns.",
      followUp: isHinglish ? "Kya main aapko ek monthly budget suggest karu?" : "Would you like me to suggest a budget for you?"
    });
  }

  if (query.includes("total savings") || query.includes("meri bachat") || query.includes("kitna bachaya")) {
    return formatResponse({
      status: `Total Income: ₹${totalIncome} | Total Expense: ₹${totalExpense}`,
      analysis: isHinglish ? `Aapki net bachat abhi **₹${savings}** hai.` : `Your current net savings stand at **₹${savings}**.`,
      recommendation: savings > 0 ? (isHinglish ? "Ye bahut badhiya hai! Is paise ko kisi goal mein lagayein." : "This is great! Allocate this surplus to a financial goal.") : (isHinglish ? "Aapki bachat minus mein hai. Aapko budget control karna hoga." : "You are in a deficit. You need strict budgeting."),
      actionPlan: isHinglish ? "Apne unnecessary expenses identify karke cut karein." : "Identify and cut down unnecessary expenses immediately.",
      followUp: isHinglish ? "Kya main batau ₹5000 kaise bachayein?" : "Would you like a plan to save ₹5000?"
    });
  }

  if (query.includes("udhari") || query.includes("owe") || query.includes("pending") || query.includes("udari") || query.includes("udhari summary")) {
    return formatResponse({
      status: `Receivables (Lene): ₹${pendingReceivables} | Payables (Dene): ₹${pendingPayables}`,
      analysis: isHinglish ? `Aapko market se **₹${pendingReceivables}** lene hain, aur **₹${pendingPayables}** logo ko chukane hain.` : `You have **₹${pendingReceivables}** pending to receive, and **₹${pendingPayables}** pending to pay.`,
      recommendation: pendingReceivables > 0 ? (isHinglish ? "Apna paisa time par wapas lena zaroori hai." : "It is crucial to collect your receivables on time.") : (isHinglish ? "Udhari clear rakhein." : "Keep your ledgers clean."),
      actionPlan: isHinglish ? "Udhari tab mein jaakar WhatsApp reminder bhejein." : "Go to the Udhari tab and send WhatsApp reminders.",
      followUp: isHinglish ? "Kya main aapka overall financial score batau?" : "Would you like to know your overall financial health score?"
    });
  }

  if (query.includes("budget")) {
    Memory.setContext(userId, 'general_review', {});
    return formatResponse({
      status: `Income: ₹${totalIncome} | Current Expenses: ₹${totalExpense}`,
      analysis: isHinglish ? "Ek achha budget aapko financially strong banata hai." : "A good budget makes you financially resilient.",
      recommendation: isHinglish ? "Main aapko 50/30/20 rule recommend karunga." : "I recommend the 50/30/20 budgeting rule.",
      actionPlan: isHinglish ? "50% Needs ke liye, 30% Wants ke liye, 20% Savings ke liye rakhein." : "Allocate 50% to Needs, 30% to Wants, and 20% to Savings.",
      followUp: isHinglish ? "Kya main aapki income ke hisaab se iska proper calculation batau? (Haan bole)" : "Shall I calculate the exact amounts for you based on your income? (Say yes)"
    });
  }

  if (query.includes("save") || query.includes("bacha") || query.includes("bachat")) {
    let target = extractedAmount || (savings <= 0 ? 5000 : savings + 2000);
    Memory.setContext(userId, 'savings_plan', { target, shortfall: target - savings });
    return formatResponse(Planner.generateSavingsPlan(userData, target, isHinglish));
  }

  if (query.includes("goal") || query.includes("lakshya") || query.includes("target")) {
    if (goals.length > 0) {
      Memory.setContext(userId, 'goal_check', { remaining: goals[0].targetAmount - goals[0].currentAmount });
    }
    return formatResponse(GoalEngine.analyzeGoalProgress(userData, isHinglish));
  }

  if (query.includes("buy") || query.includes("worth") || query.includes("leni") || query.includes("khareed")) {
    if (extractedAmount) {
      return formatResponse(Budget.analyzeAffordability(userData, extractedAmount, isHinglish));
    } else {
      return isHinglish ? "### 🛒 Purchase Check\nAap kya khareedna chahte hain aur uski price kya hai?" : "### 🛒 Purchase Check\nWhat do you want to buy and how much does it cost?";
    }
  }

  Memory.setContext(userId, 'general_review', {});
  return formatResponse(Insights.generateGeneralReview(userData, isHinglish));
};

const parseQuickTransaction = (text) => {
  const parts = text.trim().split(' ');
  const amountMatch = text.match(/\d+/);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[0]);
  const words = parts.filter(p => isNaN(p) && !['add','spent','kharcha','paid','rupees','rs'].includes(p.toLowerCase()));
  const keyword = words[0]?.toLowerCase() || 'other';

  let category = 'Other';
  if (['food', 'lunch', 'dinner', 'pizza', 'khana', 'nashta', 'chai', 'coffee'].includes(keyword)) category = 'Food';
  if (['petrol', 'uber', 'bus', 'train', 'travel', 'safar', 'auto', 'cab', 'ticket'].includes(keyword)) category = 'Travel';
  if (['movie', 'netflix', 'game', 'film', 'cinema'].includes(keyword)) category = 'Entertainment';
  if (['shirt', 'shoes', 'amazon', 'kapde', 'shopping', 'mall', 'phone'].includes(keyword)) category = 'Shopping';
  if (['bill', 'bijli', 'recharge', 'light', 'water', 'paani'].includes(keyword)) category = 'Bills';
  if (['dawai', 'doctor', 'hospital', 'medicine', 'health', 'clinic'].includes(keyword)) category = 'Health';

  return { amount, category, notes: text, type: 'expense', paymentMethod: 'UPI' };
};

module.exports = { processSmartQuery, parseQuickTransaction };