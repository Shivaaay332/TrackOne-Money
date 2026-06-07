const Income = require('../models/Income');
const { buildDateRange } = require('../utils/dateHelpers');

// @desc    Add new income record
// @route   POST /api/v1/income
// @access  Private
const addIncome = async (req, res, next) => {
  try {
    const { amount, source, date, category, notes } = req.body;
    
    let receiptImage = '';
    if (req.file) {
      receiptImage = req.file.path;
    }

    const income = await Income.create({
      user: req.user._id,
      amount: parseFloat(amount),
      source,
      date: date || new Date(),
      category,
      notes,
      receiptImage,
    });

    res.status(201).json({ success: true, data: income });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all income records with search, filter, and pagination
// @route   GET /api/v1/income
// @access  Private
const getIncomes = async (req, res, next) => {
  try {
    const { search, category, startDate, endDate, sortBy } = req.query;
    let query = { user: req.user._id };

    // Search by source or notes
    if (search) {
      query.$or = [
        { source: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    const dateRange = buildDateRange(startDate, endDate);
    if (dateRange) query.date = dateRange;

    // Sorting configuration
    let sortOptions = { date: -1 };
    if (sortBy === 'amount_asc') sortOptions = { amount: 1 };
    if (sortBy === 'amount_desc') sortOptions = { amount: -1 };
    if (sortBy === 'date_asc') sortOptions = { date: 1 };

    const incomes = await Income.find(query).sort(sortOptions);
    res.status(200).json({ success: true, count: incomes.length, data: incomes });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an income record
// @route   PUT /api/v1/income/:id
// @access  Private
const updateIncome = async (req, res, next) => {
  try {
    let income = await Income.findOne({ _id: req.params.id, user: req.user._id });

    if (!income) {
      res.status(404);
      throw new Error('Income record not found');
    }

    const { amount, source, date, category, notes } = req.body;
    
    income.amount = amount ? parseFloat(amount) : income.amount;
    income.source = source || income.source;
    income.date = date || income.date;
    income.category = category || income.category;
    income.notes = notes || income.notes;

    if (req.file) {
      income.receiptImage = req.file.path;
    }

    const updatedIncome = await income.save();
    res.status(200).json({ success: true, data: updatedIncome });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an income record
// @route   DELETE /api/v1/income/:id
// @access  Private
const deleteIncome = async (req, res, next) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!income) {
      res.status(404);
      throw new Error('Income record not found or unauthorized');
    }

    res.status(200).json({ success: true, message: 'Income record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addIncome,
  getIncomes,
  updateIncome,
  deleteIncome,
};