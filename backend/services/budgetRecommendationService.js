const analyzeAffordability = (userData, itemCost, isHinglish) => {
  const { savings, totalIncome } = userData;

  let analysis = "", recommendation = "", actionPlan = "";

  if (savings >= itemCost) {
    const remaining = savings - itemCost;
    analysis = isHinglish ? `Aapke paas ₹${savings} hain. Yeh item (₹${itemCost}) afford kar sakte hain.` : `You have ₹${savings} available. You can afford this ₹${itemCost} purchase.`;
    recommendation = remaining < (totalIncome * 0.1) 
      ? (isHinglish ? "Lekin iske baad aapki bachat bahut kam ho jayegi. Emergency risk hai." : "However, this will deplete your safety net dangerously low.")
      : (isHinglish ? "Yeh purchase safe lag raha hai." : "This purchase is financially safe for you right now.");
    actionPlan = isHinglish ? "Agar bahut zaroori hai, toh hi khareedein, warna ise delay karein." : "If it's an essential purchase, proceed. If it's a want, consider delaying it by 14 days.";
  } else {
    const shortfall = itemCost - savings;
    analysis = isHinglish ? `Aap yeh abhi afford nahi kar sakte. Aapko ₹${shortfall} aur chahiye.` : `You cannot afford this right now without going into debt. You are short by ₹${shortfall}.`;
    recommendation = isHinglish ? "Udhari ya EMI se bachein. Pehle iske liye paise bachayein." : "Avoid using credit cards or taking Udhari for this.";
    actionPlan = isHinglish ? `Is item ko 'Future Goals' mein add karein aur monthly savings start karein.` : `Add this item to your 'Future Goals' and start funding it monthly.`;
  }

  return {
    status: `Item Cost: ₹${itemCost} | Available Savings: ₹${savings}`,
    analysis, recommendation, actionPlan,
    followUp: isHinglish ? "Kya main aapko is item ke liye savings plan banakar du?" : "Would you like me to build a step-by-step savings plan to buy this?"
  };
};

module.exports = { analyzeAffordability };