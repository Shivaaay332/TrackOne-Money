const { calculateHealthScore } = require('../services/financialAnalysisService');
const { processSmartQuery, parseQuickTransaction } = require('../services/financialAdvisorService');
const Expense = require('../models/Expense');

const getAiDashboardData = async (req, res, next) => {
  try {
    const healthData = await calculateHealthScore(req.user._id);
    res.status(200).json({ success: true, data: healthData });
  } catch (error) { next(error); }
};

const chatWithAi = async (req, res, next) => {
  try {
    const { message } = req.body;
    
    const isQuestion = message.includes('?') || /(how|what|can|why|where|should|kya|kaise|kitna|mujhe|suggest|batao)\b/i.test(message.toLowerCase());
    const hasNumber = /\d+/.test(message);
    const isQuickEntry = !isQuestion && hasNumber && (/^(add|spent|paid|kharcha|jodo)\b/i.test(message) || message.split(' ').length <= 4);

    if (isQuickEntry) {
      const parsedData = parseQuickTransaction(message);
      if (parsedData) {
        const expense = await Expense.create({
          user: req.user._id, amount: parsedData.amount, category: parsedData.category, notes: parsedData.notes, paymentMethod: parsedData.paymentMethod
        });
        return res.status(201).json({ success: true, reply: `✅ Saved **${parsedData.category}** expense of **₹${parsedData.amount}**.` });
      }
    }

    const reply = await processSmartQuery(req.user._id, message);
    res.status(200).json({ success: true, reply });
    
  } catch (error) { next(error); }
};

const quickTransactionEntry = async (req, res, next) => {
  try {
    const { text } = req.body;
    const parsedData = parseQuickTransaction(text);
    if (!parsedData) return res.status(400).json({ success: false, message: "Could not detect amount." });

    const expense = await Expense.create({
      user: req.user._id, amount: parsedData.amount, category: parsedData.category, notes: parsedData.notes, paymentMethod: parsedData.paymentMethod
    });
    res.status(201).json({ success: true, message: `Saved ${parsedData.category} expense of ₹${parsedData.amount}`, data: expense });
  } catch (error) { next(error); }
};

module.exports = { getAiDashboardData, chatWithAi, quickTransactionEntry };