const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Udhari = require('../models/Udhari');
const Goal = require('../models/Goal');

const Memory = require('./conversationMemoryService');
const Planner = require('./savingsPlannerService');
const GoalEngine = require('./goalPredictionService');
const Budget = require('./budgetRecommendationService');
const Insights = require('./insightGenerationService');

const isHinglishText = (query) =>
  /(kya|kaise|kitna|mera|mujhe|batao|kharcha|bachat|bachao|bacha|karu|hai|ho|raha|chahiye|udhari|lakshya|leni|ji|haan|kardo|hua|mere|meri|bata|isko|nahi|nai|dono|sab|aur|ya|pe|se|ko|ka|ki|ke|le|kar|roz|mahine|hoga|hai|hun|bhi|abhi|paise|rupaye|paisa)/i.test(query);

const formatResponse = (data) => {
  return `### 📊 Current Status\n${data.status}\n\n### 🧠 Analysis\n${data.analysis}\n\n### 💡 Recommendation\n${data.recommendation}\n\n### 🚀 Action Plan\n${data.actionPlan}\n\n*${data.followUp}*`;
};

const processSmartQuery = async (userId, textQuery) => {
  const query = textQuery.toLowerCase().trim();
  const isHinglish = isHinglishText(query);

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
  const topExpenses = Object.keys(expMap).map(k => ({ _id: k, total: expMap[k] })).sort((a, b) => b.total - a.total);

  const userData = { totalIncome, totalExpense, savings, pendingUdhari: pendingReceivables, topExpenses, activeGoals: goals };

  const numberMatch = query.match(/\d+(?:,\d+)*(?:\.\d+)?/);
  const extractedAmount = numberMatch ? parseFloat(numberMatch[0].replace(/,/g, '')) : null;

  const isYes = /^(ha|haan|yes|yep|yup|sure|batao|bataiye|ji|ji haan|please|of course)\b/i.test(query);
  const memory = Memory.getContext(userId);

  // --- GREETING HANDLER ---
  if (/^(hi|hello|hey|namaste|namaskar|hii|helo|hola|yo|sup|salam)\b/i.test(query)) {
    const greetings = isHinglish
      ? [`Namaste! 🙏 Main TrackOne AI hun. Aap mujhse apne finances ke baare mein kuch bhi pooch sakte hain.\n\n**Kuch suggestions:**\n- "Mera total kharcha kitna hai?"\n- "Meri bachat dikhao"\n- "Budget suggest karo"\n- "Goals ka progress batao"`,
         `Hello! 👋 Kya haal hain? Main aapka financial assistant hun. Aaj main aapki kya madad kar sakta hun?`]
      : [`Hello! 👋 I'm TrackOne AI, your personal financial assistant.\n\n**You can ask me:**\n- "How much did I spend?"\n- "Show my savings"\n- "Suggest a budget"\n- "What's my goal progress?"`,
         `Hi there! 😊 Ready to help with your finances. What would you like to know today?`];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // --- HELP HANDLER ---
  if (/^(help|madad|kya kar sakte|what can you do|capabilities|features)\b/i.test(query)) {
    return isHinglish
      ? `### 🤖 Main Kya Kar Sakta Hun?\n\n**💬 Questions pucho:**\n- Kharcha, bachat, income ke baare mein\n- Udhari summary\n- Goal progress\n- Budget suggestions\n- Affordability check (kya main ye khareeg sakta hun?)\n\n**⚡ Quick Entry:**\n- "Add 500 food" — seedha expense save hoga\n- "Paid 200 petrol"\n- "Kharcha 150 chai"\n\n**🌐 Languages:** Hindi, English, ya Hinglish — koi bhi!`
      : `### 🤖 What Can I Do?\n\n**💬 Ask questions about:**\n- Spending, savings, income analysis\n- Udhari (debt) summary\n- Goal progress & planning\n- Budget recommendations\n- Affordability checks\n\n**⚡ Quick Entry:**\n- "Add 500 food" — saves expense directly\n- "Spent 200 petrol"\n- "Paid 150 coffee"\n\n**🌐 Languages:** Hindi, English, or Hinglish — all supported!`;
  }

  // --- MEMORY FOLLOW-UP ---
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
      return `### 📊 Suggested 50/30/20 Budget\nBased on your income (₹${totalIncome.toLocaleString()}):\n* **Needs (50%):** ₹${(totalIncome * 0.5).toLocaleString()}\n* **Wants (30%):** ₹${(totalIncome * 0.3).toLocaleString()}\n* **Savings/Goals (20%):** ₹${(totalIncome * 0.2).toLocaleString()}\n\n*Is rule ko follow karne se aapka financial health ekdam strong rahega!*`;
    }
  }

  // --- ADD GOAL FUNDS ---
  if ((query.includes("add") || query.includes("kardo") || query.includes("daal")) && (query.includes("goal") || query.includes("lakshya"))) {
    return `### 🎯 Goal Funding\nMain AI Chat se direct goals mein paise add nahi kar sakta.\n\nPlease app ke **'Future Goals'** section mein jaakar **'Manage Funds'** par click karein.\n\n*Kya aap apne goals ka current progress check karna chahenge?*`;
  }

  // --- INCOME ---
  if (/(income|salary|kamai|earning|aay|kitni kamai|meri income|mera salary|total income|net income)/i.test(query)) {
    if (totalIncome === 0) {
      return isHinglish
        ? `### 💰 Income Summary\nAapki abhi tak koi income recorded nahi hai. Income tab mein jaakar apni salary ya earnings add karein!`
        : `### 💰 Income Summary\nNo income recorded yet. Go to the Income section and add your earnings!`;
    }
    const incomeBySource = {};
    incomes.forEach(i => { incomeBySource[i.source || i.category || 'Other'] = (incomeBySource[i.source || i.category || 'Other'] || 0) + i.amount; });
    const topSource = Object.entries(incomeBySource).sort((a, b) => b[1] - a[1])[0];
    return isHinglish
      ? `### 💰 Income Summary\n**Total Income: ₹${totalIncome.toLocaleString()}**\n\n- Sabse zyada income source: **${topSource?.[0] || 'N/A'}** (₹${topSource?.[1]?.toLocaleString() || 0})\n- Aapne **${incomes.length} transactions** se income earn ki hai\n\n*Tip: Regular income track karna financial planning mein bahut helpful hota hai!*`
      : `### 💰 Income Summary\n**Total Income: ₹${totalIncome.toLocaleString()}**\n\n- Top income source: **${topSource?.[0] || 'N/A'}** (₹${topSource?.[1]?.toLocaleString() || 0})\n- Total of **${incomes.length} income transactions** recorded\n\n*Tip: Tracking all income sources helps in accurate financial planning!*`;
  }

  // --- SPENDING / EXPENSES ---
  if (/(spend|spent|kharcha|expense|kitna gaya|total kharcha|kharche|kitne paise gaye|paisa gaya)/i.test(query)) {
    if (totalExpense === 0) {
      return isHinglish
        ? `### 💸 Expense Summary\nAbhi tak koi expense record nahi hai. Expenses tab mein apne kharche add karo!`
        : `### 💸 Expense Summary\nNo expenses recorded yet. Add your expenses in the Expenses tab!`;
    }
    return formatResponse({
      status: `Total Income: ₹${totalIncome.toLocaleString()} | Total Expense: ₹${totalExpense.toLocaleString()}`,
      analysis: isHinglish
        ? `Aapne total **₹${totalExpense.toLocaleString()}** kharch kiye hain. Sabse zyada **${topExpenses[0]?._id || 'kisi'}** category mein (₹${topExpenses[0]?.total?.toLocaleString() || 0}) gaye hain.${topExpenses[1] ? ` Uske baad **${topExpenses[1]._id}** (₹${topExpenses[1].total.toLocaleString()}) hai.` : ''}`
        : `You have spent a total of **₹${totalExpense.toLocaleString()}**. Highest in **${topExpenses[0]?._id || 'items'}** (₹${topExpenses[0]?.total?.toLocaleString() || 0}).${topExpenses[1] ? ` Next is **${topExpenses[1]._id}** (₹${topExpenses[1].total.toLocaleString()}).` : ''}`,
      recommendation: isHinglish ? "Kharcho par dhyaan rakhna achhi aadat hai." : "Keeping track of your expenses is a great habit.",
      actionPlan: isHinglish ? "Transactions tab mein check karein ki kis din sabse zyada kharcha hua." : "Check the Transactions tab to see your daily spending patterns.",
      followUp: isHinglish ? "Kya main aapko ek monthly budget suggest karu?" : "Would you like me to suggest a personalized budget?"
    });
  }

  // --- BALANCE / NET WORTH ---
  if (/(balance|net|mera paisa|kitna bacha|total balance|net worth|remaining|baaki|financial status|overview|summary)/i.test(query)) {
    return formatResponse({
      status: `Income: ₹${totalIncome.toLocaleString()} | Expenses: ₹${totalExpense.toLocaleString()} | Net: ₹${savings.toLocaleString()}`,
      analysis: isHinglish
        ? `Aapki total income **₹${totalIncome.toLocaleString()}** hai aur total kharcha **₹${totalExpense.toLocaleString()}** hai. Net balance **₹${savings.toLocaleString()}** ${savings >= 0 ? 'bachta hai' : 'ka deficit hai'}.`
        : `Your total income is **₹${totalIncome.toLocaleString()}** and total expenses are **₹${totalExpense.toLocaleString()}**. Net balance: **₹${savings.toLocaleString()}** ${savings >= 0 ? '(surplus)' : '(deficit)'}.`,
      recommendation: savings >= 0
        ? (isHinglish ? "Aapka balance positive hai — is surplus ko invest karein ya goals mein lagayein." : "You have a positive balance — consider investing this surplus or allocating it to goals.")
        : (isHinglish ? "Aapka balance negative hai — turant budget control karna zaroori hai!" : "Your balance is negative — immediate budget control is needed!"),
      actionPlan: isHinglish ? "Dashboard pe poora financial overview dekho aur unnecessary kharche identify karo." : "Check the Dashboard for a full overview and identify unnecessary expenses.",
      followUp: isHinglish ? "Kya main aapko savings improve karne ka plan batau?" : "Shall I create a plan to improve your savings?"
    });
  }

  // --- TOTAL SAVINGS ---
  if (/(total savings|meri bachat|kitna bachaya|savings kitni|net savings|bachat dikhao)/i.test(query)) {
    return formatResponse({
      status: `Total Income: ₹${totalIncome.toLocaleString()} | Total Expense: ₹${totalExpense.toLocaleString()}`,
      analysis: isHinglish
        ? `Aapki net bachat abhi **₹${savings.toLocaleString()}** hai. Income ka **${totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0}%** bach raha hai.`
        : `Your current net savings stand at **₹${savings.toLocaleString()}** — that's **${totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0}%** of your income.`,
      recommendation: savings > 0
        ? (isHinglish ? "Ye bahut badhiya hai! Is paise ko kisi goal mein lagayein." : "This is great! Allocate this surplus to a financial goal.")
        : (isHinglish ? "Aapki bachat minus mein hai. Aapko budget control karna hoga." : "You are in a deficit. You need strict budgeting immediately."),
      actionPlan: isHinglish ? "Apne unnecessary expenses identify karke cut karein." : "Identify and cut down unnecessary expenses immediately.",
      followUp: isHinglish ? "Kya main batau ₹5000 kaise bachayein?" : "Would you like a plan to save more each month?"
    });
  }

  // --- UDHARI ---
  if (/(udhari|owe|pending|udari|debt|loan|lena|dena|udhaar|kitna lena|kitna dena)/i.test(query)) {
    if (udharis.length === 0) {
      return isHinglish
        ? `### 📋 Udhari Summary\nAapki koi pending udhari nahi hai. Sab clear hai! 🎉`
        : `### 📋 Udhari Summary\nYou have no pending udhari. All clear! 🎉`;
    }
    return formatResponse({
      status: `Receivables (Lene): ₹${pendingReceivables.toLocaleString()} | Payables (Dene): ₹${pendingPayables.toLocaleString()}`,
      analysis: isHinglish
        ? `Aapko **${udharis.filter(u => u.type === 'Lene Wale').length} logon** se total **₹${pendingReceivables.toLocaleString()}** lene hain, aur **${udharis.filter(u => u.type === 'Dene Wale').length} logon** ko **₹${pendingPayables.toLocaleString()}** dene hain.`
        : `You have **₹${pendingReceivables.toLocaleString()}** pending to receive from **${udharis.filter(u => u.type === 'Lene Wale').length} people**, and **₹${pendingPayables.toLocaleString()}** to pay to **${udharis.filter(u => u.type === 'Dene Wale').length} people**.`,
      recommendation: pendingReceivables > 0
        ? (isHinglish ? "Apna paisa time par wapas lena zaroori hai — Udhari tab se WhatsApp reminder bhejo." : "Collect your receivables on time — use the Udhari tab to send WhatsApp reminders.")
        : (isHinglish ? "Seedha Udhari tab mein jaakar pending payments settle karo." : "Head to the Udhari tab to settle your pending payments."),
      actionPlan: isHinglish ? "Udhari tab mein jaakar WhatsApp reminder bhejein ya entry settle karein." : "Go to the Udhari tab and send reminders or settle entries.",
      followUp: isHinglish ? "Kya main aapka overall financial score batau?" : "Would you like to know your overall financial health score?"
    });
  }

  // --- BUDGET ---
  if (/(budget|budgeting|plan|50.30.20|allocation)/i.test(query)) {
    Memory.setContext(userId, 'general_review', {});
    return formatResponse({
      status: `Income: ₹${totalIncome.toLocaleString()} | Current Expenses: ₹${totalExpense.toLocaleString()}`,
      analysis: isHinglish
        ? `Aapki income **₹${totalIncome.toLocaleString()}** ke hisaab se ek smart budget banaya ja sakta hai.`
        : `Based on your income of **₹${totalIncome.toLocaleString()}**, here's a smart budget breakdown.`,
      recommendation: isHinglish ? "Main aapko proven **50/30/20 rule** recommend karunga." : "I recommend the proven **50/30/20 budgeting rule**.",
      actionPlan: isHinglish
        ? `• **Needs (50%):** ₹${(totalIncome * 0.5).toLocaleString()} — rent, groceries, bills\n• **Wants (30%):** ₹${(totalIncome * 0.3).toLocaleString()} — entertainment, dining\n• **Savings (20%):** ₹${(totalIncome * 0.2).toLocaleString()} — goals & investments`
        : `• **Needs (50%):** ₹${(totalIncome * 0.5).toLocaleString()} — rent, groceries, bills\n• **Wants (30%):** ₹${(totalIncome * 0.3).toLocaleString()} — entertainment, dining\n• **Savings (20%):** ₹${(totalIncome * 0.2).toLocaleString()} — goals & investments`,
      followUp: isHinglish ? "Kya main aapke current kharche ke hisaab se detailed breakdown batau? (Haan bole)" : "Shall I show a detailed breakdown vs your actual spending? (Say yes)"
    });
  }

  // --- SAVE / BACHAT ---
  if (/(save|bacha|bachat|saving plan|kitna bachau|saving target)/i.test(query)) {
    let target = extractedAmount || (savings <= 0 ? 5000 : savings + 2000);
    Memory.setContext(userId, 'savings_plan', { target, shortfall: target - savings });
    return formatResponse(Planner.generateSavingsPlan(userData, target, isHinglish));
  }

  // --- GOAL ---
  if (/(goal|lakshya|target|future plan|saving goal)/i.test(query)) {
    if (goals.length > 0) {
      Memory.setContext(userId, 'goal_check', { remaining: goals[0].targetAmount - goals[0].currentAmount });
    }
    return formatResponse(GoalEngine.analyzeGoalProgress(userData, isHinglish));
  }

  // --- BUY / AFFORDABILITY ---
  if (/(buy|worth|leni|khareed|purchase|afford|le sakta|khareed sakta)/i.test(query)) {
    if (extractedAmount) {
      return formatResponse(Budget.analyzeAffordability(userData, extractedAmount, isHinglish));
    }
    return isHinglish
      ? `### 🛒 Affordability Check\nKya khareedna chahte hain aur uski price kya hai? Bata do, main check karunga!\n\n*Example: "Kya main 15000 ka phone khareed sakta hun?"*`
      : `### 🛒 Affordability Check\nWhat do you want to buy and at what price? I'll check if it's affordable!\n\n*Example: "Can I afford to buy a ₹15000 phone?"*`;
  }

  // --- HEALTH SCORE ---
  if (/(score|health score|financial health|financial score)/i.test(query)) {
    return isHinglish
      ? `### 🏆 Financial Health Score\nAapka financial health score AI Dashboard pe dikh raha hai.\n\n**Score kaise calculate hota hai:**\n- 💰 Savings Rate (40 points)\n- 🎯 Goal Progress (30 points)\n- 📋 Udhari Risk (30 points)\n\nAbhi aapki savings rate **${totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0}%** hai. ${savings >= totalIncome * 0.2 ? '✅ Bahut achha!' : '⚠️ Isko improve karo!'}`
      : `### 🏆 Financial Health Score\nYour financial health score is visible on the AI Dashboard.\n\n**Score breakdown:**\n- 💰 Savings Rate (40 points)\n- 🎯 Goal Progress (30 points)\n- 📋 Udhari Risk (30 points)\n\nCurrent savings rate: **${totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0}%**. ${savings >= totalIncome * 0.2 ? '✅ Excellent!' : '⚠️ Needs improvement!'}`;
  }

  // --- CATEGORY BREAKDOWN ---
  if (/(category|categories|kaun si category|top expense|highest|sabse zyada|breakdown)/i.test(query)) {
    if (topExpenses.length === 0) {
      return isHinglish ? `### 📊 Category Breakdown\nAbhi tak koi expense record nahi hai!` : `### 📊 Category Breakdown\nNo expenses recorded yet!`;
    }
    const list = topExpenses.slice(0, 5).map((e, i) => `${i + 1}. **${e._id}**: ₹${e.total.toLocaleString()}`).join('\n');
    return isHinglish
      ? `### 📊 Top Spending Categories\n${list}\n\n*Total: ₹${totalExpense.toLocaleString()}*\n\nSabse zyada **${topExpenses[0]._id}** pe kharch ho raha hai.`
      : `### 📊 Top Spending Categories\n${list}\n\n*Total: ₹${totalExpense.toLocaleString()}*\n\nHighest spend is on **${topExpenses[0]._id}**.`;
  }

  // --- TIPS / ADVICE ---
  if (/(tip|advice|suggestion|sujhav|kya karu|kaise bachau|financial advice|improve)/i.test(query)) {
    const tips = isHinglish
      ? [`💡 **Tip:** 50/30/20 rule follow karo — 50% needs, 30% wants, 20% savings.`, `💡 **Tip:** Ek emergency fund banao jo 3-6 mahine ke kharcho ke barabar ho.`, `💡 **Tip:** Har mahine pehle bachat karo, phir kharch karo — "Pay Yourself First".`, `💡 **Tip:** Subscriptions review karo — kai baar unused subscriptions paise waste karti hain.`]
      : [`💡 **Tip:** Follow the 50/30/20 rule — 50% needs, 30% wants, 20% savings.`, `💡 **Tip:** Build an emergency fund covering 3-6 months of expenses.`, `💡 **Tip:** "Pay yourself first" — save before spending each month.`, `💡 **Tip:** Audit your subscriptions — many go unused and waste money.`];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    return `### ✨ Financial Tip\n${randomTip}\n\n*Kya aap apne specific finances ke baare mein discuss karna chahenge?*`;
  }

  // --- THANK YOU ---
  if (/^(thanks|thank you|shukriya|dhanyawad|theek hai|ok|okay|got it|samajh gaya|acha)\b/i.test(query)) {
    return isHinglish
      ? `Bilkul! 😊 Koi bhi sawaal ho toh poochho. Main hamesha available hun! 🤖`
      : `You're welcome! 😊 Feel free to ask anything anytime. I'm always here! 🤖`;
  }

  // --- DEFAULT GENERAL REVIEW ---
  Memory.setContext(userId, 'general_review', {});
  return formatResponse(Insights.generateGeneralReview(userData, isHinglish));
};

const parseQuickTransaction = (text) => {
  const parts = text.trim().split(' ');
  const amountMatch = text.match(/\d+(?:,\d+)*/);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[0].replace(/,/g, ''));
  const words = parts.filter(p => isNaN(p) && !['add', 'spent', 'kharcha', 'paid', 'rupees', 'rs', 'joda', 'kardo', 'for', 'on', 'pe'].includes(p.toLowerCase()));
  const keyword = words[0]?.toLowerCase() || 'other';

  let category = 'Other';
  if (['food', 'lunch', 'dinner', 'pizza', 'khana', 'nashta', 'chai', 'coffee', 'breakfast', 'snack', 'khaana', 'bhojan', 'meal', 'restaurant', 'swiggy', 'zomato'].includes(keyword)) category = 'Food';
  else if (['petrol', 'uber', 'bus', 'train', 'travel', 'safar', 'auto', 'cab', 'ticket', 'metro', 'ola', 'rapido', 'fuel', 'diesel', 'transport'].includes(keyword)) category = 'Travel';
  else if (['movie', 'netflix', 'game', 'film', 'cinema', 'spotify', 'prime', 'hotstar', 'youtube', 'outing', 'party', 'gaming'].includes(keyword)) category = 'Entertainment';
  else if (['shirt', 'shoes', 'amazon', 'kapde', 'shopping', 'mall', 'phone', 'clothes', 'jeans', 'bag', 'flipkart', 'meesho', 'dress'].includes(keyword)) category = 'Shopping';
  else if (['bill', 'bijli', 'recharge', 'light', 'water', 'paani', 'electricity', 'internet', 'wifi', 'rent', 'emi', 'gas', 'mobile'].includes(keyword)) category = 'Bills';
  else if (['dawai', 'doctor', 'hospital', 'medicine', 'health', 'clinic', 'dawa', 'medical', 'pharmacy', 'checkup', 'test'].includes(keyword)) category = 'Health';
  else if (['gym', 'yoga', 'fitness', 'exercise', 'sport', 'swimming'].includes(keyword)) category = 'Health';
  else if (['book', 'course', 'education', 'tuition', 'school', 'college', 'fees', 'stationery'].includes(keyword)) category = 'Education';

  return { amount, category, notes: text, type: 'expense', paymentMethod: 'UPI' };
};

module.exports = { processSmartQuery, parseQuickTransaction };
