const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Udhari = require('../models/Udhari');
const Goal = require('../models/Goal');

const processUserQuery = async (userId, textQuery) => {
  const query = textQuery.toLowerCase();
  
  // Basic Language Detection (Hinglish/Hindi vs English)
  const isHinglish = /(kya|kaise|kitna|mera|mujhe|batao|kharcha|bachat|bachao|bacha|karu|ha|hai|ho|raha|chahiye|udhari|lakshya)/i.test(query);

  // 1. UDHARI SUMMARY
  if (query.includes("udhari") || query.includes("udari") || query.includes("owe") || query.includes("pending")) {
    const udharis = await Udhari.find({ user: userId, isSettled: false });
    let lene = 0, dene = 0;
    udharis.forEach(u => {
      if (u.type === 'Lene Wale') lene += u.amount;
      if (u.type === 'Dene Wale') dene += u.amount;
    });
    
    if (isHinglish) return `Aapki pending Udhari summary:\n\n* **Aapko lene hain (Receivables):** ₹${lene.toLocaleString()}\n* **Aapko dene hain (Payables):** ₹${dene.toLocaleString()}`;
    return `Here is your Udhari summary:\n\n* **To Get (Receivables):** ₹${lene.toLocaleString()}\n* **To Pay (Payables):** ₹${dene.toLocaleString()}`;
  }

  // 2. GOAL PROGRESS
  if (query.includes("goal") || query.includes("lakshya") || query.includes("target")) {
    const goals = await Goal.find({ user: userId, isCompleted: false });
    if (goals.length === 0) {
      if (isHinglish) return "Abhi aapka koi active goal nahi hai. Naya goal set karein!";
      return "You don't have any active goals right now.";
    }
    
    let totalTarget = 0, totalSaved = 0;
    goals.forEach(g => { totalTarget += g.targetAmount; totalSaved += g.currentAmount; });
    const percent = totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0;
    
    if (isHinglish) return `Aapke ${goals.length} active goals hain. Aapne total **₹${totalTarget.toLocaleString()}** ke target mein se **₹${totalSaved.toLocaleString()}** (${percent}%) achieve kar liya hai.`;
    return `You have ${goals.length} active goals. You have saved **₹${totalSaved.toLocaleString()}** out of your **₹${totalTarget.toLocaleString()}** target (${percent}% completed).`;
  }

  // 3. HIGHEST EXPENSE
  if (query.includes("spend most") || query.includes("highest expense") || query.includes("sabse zyada kharcha") || query.includes("jyada kharcha") || query.includes("sabse jada") || query.includes("kahan hua")) {
    const expenses = await Expense.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 1 }
    ]);
    if (expenses.length > 0) {
      if (isHinglish) return `Aapne sabse zyada kharcha **${expenses[0]._id}** par kiya hai (₹${expenses[0].total.toLocaleString()}).`;
      return `You spent the most on **${expenses[0]._id}** (₹${expenses[0].total.toLocaleString()}).`;
    }
    if (isHinglish) return "Abhi tak aapka koi kharcha record nahi hua hai.";
    return "You don't have enough expense data yet.";
  }

  // 4. TOTAL SAVINGS
  if ((query.includes("how much") && query.includes("save")) || query.includes("kitna bachaya") || query.includes("meri bachat") || query.includes("total savings")) {
    const incomes = await Income.aggregate([{ $match: { user: userId } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
    const expenses = await Expense.aggregate([{ $match: { user: userId } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
    const totalIn = incomes[0]?.total || 0;
    const totalOut = expenses[0]?.total || 0;
    const savings = totalIn - totalOut;
    
    if (isHinglish) return `Aapki total bachat (savings) abhi **₹${savings.toLocaleString()}** hai!`;
    return `Your total net savings currently stand at **₹${savings.toLocaleString()}**!`;
  }

  // 5. AFFORDABILITY CHECK
  if (query.includes("can i buy") || query.includes("worth") || query.includes("kya main") || query.includes("le sakta hu") || query.includes("khareed sakta hu")) {
    const amountMatch = query.match(/\d+(?:,\d+)*(?:\.\d+)?/);
    if (amountMatch) {
      const itemCost = parseFloat(amountMatch[0].replace(/,/g, ''));
      const incomes = await Income.aggregate([{ $match: { user: userId } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
      const expenses = await Expense.aggregate([{ $match: { user: userId } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
      const savings = (incomes[0]?.total || 0) - (expenses[0]?.total || 0);

      if (savings >= itemCost) {
        if (isHinglish) return `Haan bilkul! Aapke paas ₹${savings.toLocaleString()} ki bachat hai, jo is ₹${itemCost.toLocaleString()} ke kharche ko cover kar legi.`;
        return `Yes! You currently have ₹${savings.toLocaleString()} in savings, which covers the ₹${itemCost.toLocaleString()} cost.`;
      } else {
        const needed = itemCost - savings;
        if (isHinglish) return `Abhi thoda mushkil hai. Aapko iske liye ₹${needed.toLocaleString()} aur bachane padenge warna aap udhari mein ja sakte hain.`;
        return `Not right now. You need ₹${needed.toLocaleString()} more in savings to afford this comfortably.`;
      }
    }
  }

  // 6. SUGGESTIONS / ADVICE / HOW TO SAVE (Fixed "kaise bacha sakta hu")
  if (query.includes("suggest") || query.includes("advice") || query.includes("tips") || query.includes("kaise bachau") || query.includes("reduce expense") || query.includes("kam karu") || query.includes("bacha sakta hu") || query.includes("budget")) {
     if (isHinglish) return "Aapko apne **'Food'** aur **'Shopping'** expenses ko dhyan se track karna chahiye. Bahar ka khana kam karke aur faltu kharcho par control karke aap asani se badi bachat kar sakte hain. Ek systematic goal banakar shuru karein! 😊";
     return "I suggest tracking your **'Food'** and **'Shopping'** categories closely. Reducing dining out and controlling impulse purchases are the fastest ways to increase your savings. Setting a firm monthly budget helps! 😊";
  }

  // Fallback (Ab AI clear list dega ki wo kya-kya bata sakta hai)
  if (isHinglish) return "Main aapka TrackOne AI hu. Aap mujhse poocha sakte hain:\n* 'Mera sabse zyada kharcha kahan hua?'\n* 'Meri udhari summary batao'\n* 'Mera goal progress kya hai?'\n* 'Total savings kitni hai?'\n* 'Main bachat kaise karu?'";
  
  return "I'm your TrackOne AI. Try asking:\n* 'What did I spend most on?'\n* 'Udhari summary'\n* 'What is my goal progress?'\n* 'Show my total savings'\n* 'Suggest a budget'";
};

const parseQuickTransaction = (text) => {
  const parts = text.trim().split(' ');
  const amountMatch = text.match(/\d+/);
  if (!amountMatch) return null;
  
  const amount = parseFloat(amountMatch[0]);
  const words = parts.filter(p => isNaN(p) && !['add','spent','kharcha','paid','rupees','rs'].includes(p.toLowerCase()));
  const keyword = words[0]?.toLowerCase() || 'other';

  let category = 'Other';
  
  // Hinglish + English Category Mapping
  if (['food', 'lunch', 'dinner', 'pizza', 'khana', 'nashta', 'chai', 'coffee'].includes(keyword)) category = 'Food';
  if (['petrol', 'uber', 'bus', 'train', 'travel', 'safar', 'auto', 'cab', 'ticket'].includes(keyword)) category = 'Travel';
  if (['movie', 'netflix', 'game', 'film', 'cinema'].includes(keyword)) category = 'Entertainment';
  if (['shirt', 'shoes', 'amazon', 'kapde', 'shopping', 'mall', 'phone'].includes(keyword)) category = 'Shopping';
  if (['bill', 'bijli', 'recharge', 'light', 'water', 'paani'].includes(keyword)) category = 'Bills';
  if (['dawai', 'doctor', 'hospital', 'medicine', 'health', 'clinic'].includes(keyword)) category = 'Health';

  return { amount, category, notes: text, type: 'expense', paymentMethod: 'UPI' };
};

module.exports = { processUserQuery, parseQuickTransaction };