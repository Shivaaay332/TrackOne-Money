const User = require('../models/User');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Udhari = require('../models/Udhari');
const Goal = require('../models/Goal');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');

// @desc    Update user profile & avatar
// @route   PUT /api/v1/settings/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.file) {
      user.profilePhoto = req.file.path;
    }

    if (req.body.password) {
      user.password = req.body.password; // Pre-save hook will hash it
    }

    const updatedUser = await user.save();
    res.status(200).json({
      success: true,
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profilePhoto: updatedUser.profilePhoto
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export all user data as JSON (Backup)
// @route   GET /api/v1/settings/backup
// @access  Private
const exportUserData = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [incomes, expenses, udharis, goals] = await Promise.all([
      Income.find({ user: userId }).select('-_id -user -__v -createdAt -updatedAt'),
      Expense.find({ user: userId }).select('-_id -user -__v -createdAt -updatedAt'),
      Udhari.find({ user: userId }).select('-_id -user -__v -createdAt -updatedAt'),
      Goal.find({ user: userId }).select('-_id -user -__v -createdAt -updatedAt')
    ]);

    const backupData = {
      exportDate: new Date(),
      app: 'TrackOne-Money',
      data: {
        incomes,
        expenses,
        udharis,
        goals
      }
    };

    res.header("Content-Type", 'application/json');
    res.attachment(`TrackOne_Backup_${new Date().toISOString().split('T')[0]}.json`);
    res.status(200).send(backupData);
  } catch (error) {
    next(error);
  }
};

// @desc    Import JSON data (Restore)
// @route   POST /api/v1/settings/restore
// @access  Private
const importUserData = async (req, res, next) => {
  try {
    const { incomes, expenses, udharis, goals } = req.body.data;
    const userId = req.user._id;

    // Helper function to attach user ID to imported records
    const attachUser = (arr) => arr ? arr.map(item => ({ ...item, user: userId })) : [];

    if (incomes && incomes.length > 0) await Income.insertMany(attachUser(incomes));
    if (expenses && expenses.length > 0) await Expense.insertMany(attachUser(expenses));
    if (udharis && udharis.length > 0) await Udhari.insertMany(attachUser(udharis));
    if (goals && goals.length > 0) await Goal.insertMany(attachUser(goals));

    res.status(200).json({ success: true, message: 'Data restored successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Factory Reset (Delete all user transactions & data, keep account)
// @route   DELETE /api/v1/settings/factory-reset
// @access  Private
const factoryReset = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { pin } = req.body; // Require PIN for factory reset

    const user = await User.findById(userId);
    if (!user || !(await user.matchPin(pin))) {
      res.status(401);
      throw new Error('Invalid PIN. Factory reset aborted.');
    }

    await Promise.all([
      Income.deleteMany({ user: userId }),
      Expense.deleteMany({ user: userId }),
      Udhari.deleteMany({ user: userId }),
      Goal.deleteMany({ user: userId }),
      Notification.deleteMany({ user: userId })
    ]);

    res.status(200).json({ success: true, message: 'Factory reset complete. All data wiped.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { updateProfile, exportUserData, importUserData, factoryReset };