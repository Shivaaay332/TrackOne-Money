const analyzeGoalProgress = (userData, isHinglish) => {
  const { activeGoals, savings } = userData;

  if (!activeGoals || activeGoals.length === 0) {
    return {
      status: "No active goals found.",
      analysis: isHinglish ? "Aapne system mein abhi tak koi goal set nahi kiya hai." : "You haven't set any financial goals in the system yet.",
      recommendation: isHinglish ? "Bina lakshya ke savings karna mushkil hota hai." : "Saving money without a clear target is difficult.",
      actionPlan: isHinglish ? "Future Goals section mein jaakar ek goal create karein." : "Go to the Future Goals section and create your first goal.",
      followUp: isHinglish ? "Kya main aapko budget ke baare mein batau?" : "Would you like to hear a general savings plan first?"
    };
  }

  const primaryGoal = activeGoals[0]; 
  const remaining = primaryGoal.targetAmount - primaryGoal.currentAmount;
  const progress = ((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100).toFixed(1);
  
  let probability = "High (90%+)";
  if (savings <= 0) probability = "Low (Risk of failure)";
  else if (savings < remaining / 3) probability = "Medium (Requires strict budgeting)";

  return {
    status: `Goal: ${primaryGoal.goalName} | Target: ₹${primaryGoal.targetAmount} | Saved: ₹${primaryGoal.currentAmount} (${progress}%)`,
    analysis: isHinglish ? `Aapne **${progress}%** rasta tay kar liya hai! Probability of success: **${probability}**.` : `You are **${progress}%** of the way there! Current probability of success: **${probability}**.`,
    recommendation: isHinglish ? `Aapko ₹${remaining} aur chahiye is goal ko complete karne ke liye.` : `You need exactly ₹${remaining} more to achieve this goal.`,
    actionPlan: isHinglish ? `Apni current month ki bachat (₹${Math.max(0, savings)}) ko is goal mein transfer karein.` : `Transfer your current unallocated savings (₹${Math.max(0, savings)}) into this goal's fund.`,
    followUp: isHinglish ? "Kya main batau ki is goal ke liye daily kitna bachana padega?" : "Shall I calculate the daily savings required to hit this target faster?"
  };
};

module.exports = { analyzeGoalProgress };