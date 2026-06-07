const Expense = require('../models/Expense');
const { buildDateRange } = require('../utils/dateHelpers');

// @desc    Add new expense record
// @route   POST /api/v1/expenses
// @access  Private
const addExpense = async (req, res, next) => {
  try {
    const { amount, category, date, paymentMethod, notes } = req.body;

    let receiptImage = '';
    if (req.file) {
      receiptImage = req.file.path;
    }

    const expense = await Expense.create({
      user: req.user._id,
      amount: parseFloat(amount),
      category,
      date: date || new Date(),
      paymentMethod,
      notes,
      receiptImage,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all expense records with search, filters, and time summaries
// @route   GET /api/v1/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
  try {
    const { search, category, paymentMethod, startDate, endDate, sortBy } = req.query;
    let query = { user: req.user._id };

    if (search) {
      query.notes = { $regex: search, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    const dateRange = buildDateRange(startDate, endDate);
    if (dateRange) query.date = dateRange;

    let sortOptions = { date: -1 };
    if (sortBy === 'amount_asc') sortOptions = { amount: 1 };
    if (sortBy === 'amount_desc') sortOptions = { amount: -1 };
    if (sortBy === 'date_asc') sortOptions = { date: 1 };

    const expenses = await Expense.find(query).sort(sortOptions);
    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an expense record
// @route   PUT /api/v1/expenses/:id
// @access  Private
const updateExpense = async (req, res, next) => {
  try {
    let expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

    if (!expense) {
      res.status(404);
      throw new Error('Expense record not found');
    }

    const { amount, category, date, paymentMethod, notes } = req.body;

    expense.amount = amount ? parseFloat(amount) : expense.amount;
    expense.category = category || expense.category;
    expense.date = date || expense.date;
    expense.paymentMethod = paymentMethod || expense.paymentMethod;
    expense.notes = notes || expense.notes;

    if (req.file) {
      expense.receiptImage = req.file.path;
    }

    const updatedExpense = await expense.save();
    res.status(200).json({ success: true, data: updatedExpense });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an expense record
// @route   DELETE /api/v1/expenses/:id
// @access  Private
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!expense) {
      res.status(404);
      throw new Error('Expense record not found or unauthorized');
    }

    res.status(200).json({ success: true, message: 'Expense record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
};