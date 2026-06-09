const Notification = require('../models/Notification');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Goal = require('../models/Goal');
const Udhari = require('../models/Udhari');

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await generateSmartNotifications(userId);

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true }
    );
    res.status(200).json({ success: true });
  } catch (error) { next(error); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) { next(error); }
};

const generateSmartNotifications = async (userId) => {
  try {
    const [incomes, expenses, goals, udharis] = await Promise.all([
      Income.find({ user: userId }),
      Expense.find({ user: userId }),
      Goal.find({ user: userId, isCompleted: false }),
      Udhari.find({ user: userId, isSettled: false }),
    ]);

    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    const toCreate = [];
    const now = new Date();

    if (totalExpense > totalIncome * 0.9 && totalIncome > 0) {
      const exists = await Notification.findOne({ user: userId, type: 'Budget Alert', isRead: false });
      if (!exists) {
        toCreate.push({
          user: userId,
          title: '⚠️ Budget Alert',
          message: `Aapne apni income ka ${Math.round((totalExpense/totalIncome)*100)}% kharch kar diya hai. Budget control karo!`,
          type: 'Budget Alert',
        });
      }
    }

    if (savingsRate < 10 && totalIncome > 0) {
      const exists = await Notification.findOne({ user: userId, type: 'Budget Alert', message: /savings/i, isRead: false });
      if (!exists) {
        toCreate.push({
          user: userId,
          title: '💡 Low Savings Rate',
          message: `Aapki savings rate sirf ${savingsRate.toFixed(1)}% hai. Kam se kam 20% bachane ki koshish karo.`,
          type: 'Budget Alert',
        });
      }
    }

    for (const goal of goals) {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      if (progress >= 80 && progress < 100) {
        const exists = await Notification.findOne({ user: userId, type: 'Goal Reminder', message: new RegExp(goal.name, 'i'), isRead: false });
        if (!exists) {
          toCreate.push({
            user: userId,
            title: '🎯 Goal Almost Complete!',
            message: `"${goal.name}" goal ${progress.toFixed(0)}% complete ho gaya! Bas thoda aur push karo.`,
            type: 'Goal Reminder',
          });
        }
      }
    }

    const pendingPayables = udharis.filter(u => u.type === 'Dene Wale');
    for (const u of pendingPayables) {
      if (u.dueDate) {
        const daysLeft = Math.ceil((new Date(u.dueDate) - now) / (1000 * 60 * 60 * 24));
        if (daysLeft >= 0 && daysLeft <= 3) {
          const exists = await Notification.findOne({ user: userId, type: 'Udhari Reminder', message: new RegExp(u.personName, 'i'), isRead: false });
          if (!exists) {
            toCreate.push({
              user: userId,
              title: '🔔 Udhari Due Soon',
              message: `${u.personName} ko ₹${u.amount} dene hain. Due date: ${daysLeft === 0 ? 'Aaj!' : `${daysLeft} din mein`}`,
              type: 'Udhari Reminder',
            });
          }
        }
      }
    }

    const hasWelcome = await Notification.findOne({ user: userId, type: 'System' });
    if (!hasWelcome) {
      toCreate.push({
        user: userId,
        title: '👋 Welcome to TrackOne!',
        message: 'Apni financial journey shuru karo. Expenses track karo, goals set karo aur AI se guidance lo!',
        type: 'System',
      });
    }

    if (toCreate.length > 0) {
      await Notification.insertMany(toCreate);
    }
  } catch (err) {
    console.error('Smart notification generation error:', err.message);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
