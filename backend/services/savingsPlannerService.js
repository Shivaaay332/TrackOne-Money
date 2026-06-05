const generateSavingsPlan = (userData, targetAmount, isHinglish) => {
  const { savings, topExpenses } = userData;
  const shortfall = targetAmount - savings;

  if (shortfall <= 0) {
    return {
      status: `Current Savings: ₹${savings} | Target: ₹${targetAmount}`,
      analysis: isHinglish ? `Aapke paas already target se zyada (₹${savings}) bachat hai!` : `You have already exceeded your target! You have ₹${savings} saved.`,
      recommendation: isHinglish ? "Aap is paise ko Future Goals mein invest kar sakte hain." : "You can allocate this surplus to your Future Goals or investments.",
      actionPlan: isHinglish ? "Future Goals tab mein jaakar ek naya goal add karein." : "Open the Future Goals tab and fund an active goal.",
      followUp: isHinglish ? "Kya main aapke goals ka progress check karu?" : "Shall I check the progress of your current goals?"
    };
  }

  let cutPlan = "";
  let dailySaving = Math.ceil(shortfall / 30);
  
  if (topExpenses.length >= 2) {
    const cut1 = Math.round(topExpenses[0].total * 0.15);
    const cut2 = Math.round(topExpenses[1].total * 0.20);
    cutPlan = isHinglish 
      ? `1. **${topExpenses[0]._id}** expenses ko 15% kam karein (Save ₹${cut1})\n2. **${topExpenses[1]._id}** expenses ko 20% kam karein (Save ₹${cut2})`
      : `1. Reduce **${topExpenses[0]._id}** spending by 15% (Save ₹${cut1})\n2. Reduce **${topExpenses[1]._id}** spending by 20% (Save ₹${cut2})`;
  } else {
    cutPlan = isHinglish ? `Faltu kharcho ko strictly control karein.` : `Strictly monitor and cut down on non-essential spending.`;
  }

  return {
    status: `Current Savings: ₹${savings} | Target: ₹${targetAmount} | Shortfall: ₹${shortfall}`,
    analysis: isHinglish ? `Aapko target hit karne ke liye ₹${shortfall} aur chahiye.` : `You need an additional ₹${shortfall} to reach your target.`,
    recommendation: isHinglish ? "Apne sabse bade kharcho ko target karke hum ye gap cover kar sakte hain." : "We can close this gap by temporarily reducing your top expenses.",
    actionPlan: `${cutPlan}\n\n${isHinglish ? `👉 **Daily Target:** Rozana ₹${dailySaving} bachane ki koshish karein.` : `👉 **Daily Target:** Try to save exactly ₹${dailySaving} every day.`}`,
    followUp: isHinglish ? "Kya aap daily savings ka detailed breakdown chahte hain?" : "Would you like a detailed daily breakdown of this plan?"
  };
};

module.exports = { generateSavingsPlan };