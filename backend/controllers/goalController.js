const Goal = require('../models/Goal');

// @desc    Create a new future financial saving goal
// @route   POST /api/v1/goals
// @access  Private
const createGoal = async (req, res, next) => {
  try {
    const { goalName, targetAmount, targetMonth, reason, notes, priorityLevel } = req.body;

    const goal = await Goal.create({
      user: req.user._id,
      goalName,
      targetAmount: parseFloat(targetAmount),
      targetMonth,
      reason,
      notes,
      priorityLevel,
    });

    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all financial goals for the user
// @route   GET /api/v1/goals
// @access  Private
const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ targetMonth: 1 });
    res.status(200).json({ success: true, count: goals.length, data: goals });
  } catch (error) {
    next(error);
  }
};

// @desc    Allocate or withdraw funds from a goal
// @route   PATCH /api/v1/goals/:id/fund
// @access  Private
const manageGoalFunds = async (req, res, next) => {
  try {
    const { amount, actionType } = req.body; // actionType: 'add' or 'withdraw'
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });

    if (!goal) {
      res.status(404);
      throw new Error('Financial target goal not found');
    }

    const fundingChange = parseFloat(amount);
    if (actionType === 'add') {
      goal.currentAmount += fundingChange;
    } else if (actionType === 'withdraw') {
      if (goal.currentAmount < fundingChange) {
        res.status(400);
        throw new Error('Insufficient funds allocated to this goal to execute withdrawal');
      }
      goal.currentAmount -= fundingChange;
    }

    // Auto calculate system completion check status
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    } else {
      goal.isCompleted = false;
    }

    await goal.save();
    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a target goal
// @route   DELETE /api/v1/goals/:id
// @access  Private
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!goal) {
      res.status(404);
      throw new Error('Goal record not found or unauthorized');
    }

    res.status(200).json({ success: true, message: 'Goal target dropped successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGoal,
  getGoals,
  manageGoalFunds,
  deleteGoal,
};