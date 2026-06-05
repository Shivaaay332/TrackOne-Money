const generateGeneralReview = (userData, isHinglish) => {
  const { totalIncome, totalExpense, savings, topExpenses, pendingUdhari } = userData;
  const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0;

  let analysis = "";
  let recommendation = "";
  let actionPlan = "";

  if (savingsRate > 20) {
    analysis = isHinglish ? `Aapka savings rate ${savingsRate}% hai, jo ki bahut achha hai!` : `Your savings rate is an excellent ${savingsRate}%.`;
  } else if (savingsRate > 0) {
    analysis = isHinglish ? `Aap thoda bacha rahe hain (${savingsRate}%), par isko 20% tak le jana chahiye.` : `You are saving ${savingsRate}%, but there is room for improvement to reach the 20% benchmark.`;
  } else {
    analysis = isHinglish ? `Aapka kharcha aapki income se zyada hai. Yeh ek financial risk hai.` : `Your expenses currently exceed your income, creating a cash flow deficit.`;
  }

  if (topExpenses.length > 0) {
    analysis += isHinglish ? ` Sabse bada kharcha **${topExpenses[0]._id}** (₹${topExpenses[0].total}) par hua hai.` : ` Your biggest money leak is **${topExpenses[0]._id}** (₹${topExpenses[0].total}).`;
  }

  if (pendingUdhari > 0) {
    recommendation = isHinglish ? "Market mein aapka paisa fasa hua hai." : "You have capital tied up in the market.";
    actionPlan = isHinglish ? `Udhari section mein jaakar ₹${pendingUdhari} ki recovery ke liye WhatsApp reminders bhejein.` : `Send immediate WhatsApp reminders to recover your pending ₹${pendingUdhari}.`;
  } else {
    recommendation = isHinglish ? "Apne top expenses ko optimize karne ka time hai." : "It's time to optimize your highest spending categories.";
    actionPlan = isHinglish ? `Is mahine **${topExpenses[0]?._id || 'unnecessary items'}** par apna budget 15% kam karein.` : `Cut down your **${topExpenses[0]?._id || 'variable'}** expenses by 15% this month to boost savings.`;
  }

  return {
    status: isHinglish ? `Income: ₹${totalIncome} | Expenses: ₹${totalExpense} | Savings: ₹${savings}` : `Income: ₹${totalIncome} | Expenses: ₹${totalExpense} | Savings: ₹${savings}`,
    analysis, recommendation, actionPlan,
    followUp: isHinglish ? "Kya main aapke liye ek custom budget plan banau?" : "Would you like me to create a custom monthly budget plan for you?"
  };
};

module.exports = { generateGeneralReview };