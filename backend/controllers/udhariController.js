const mongoose = require('mongoose');
const Udhari = require('../models/Udhari');
const HistoryLog = mongoose.models.HistoryLog || require('../models/HistoryLog'); // 🔥 HISTORY MODEL IMPORT

// @desc    Add new credit or debit record
// @route   POST /api/v1/udhari
// @access  Private
const addUdhariRecord = async (req, res, next) => {
  try {
    const { type, personName, phoneNumber, amount, date, dueDate, description } = req.body;

    const udhari = await Udhari.create({
      user: req.user._id,
      type, // 'Lene Wale' or 'Dene Wale'
      personName,
      phoneNumber,
      amount: parseFloat(amount),
      date: date || new Date(),
      dueDate,
      description,
    });

    // 🔥 AUTO-HISTORY: Record Creation 🔥
    await HistoryLog.create({
      user: req.user._id,
      moduleType: 'Udhari',
      recordId: udhari._id,
      actionType: type === 'Lene Wale' ? 'Added' : 'Withdrawn',
      amount: udhari.amount,
      date: new Date(),
      note: `Initial Entry: Udhari of ₹${udhari.amount} logged for ${personName}.`
    });

    res.status(201).json({ success: true, data: udhari });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all udhari records with advanced financial aggregations
// @route   GET /api/v1/udhari
// @access  Private
const getUdhariRecords = async (req, res, next) => {
  try {
    const { type, isSettled, search } = req.query;
    let query = { user: req.user._id };

    if (type) query.type = type;
    if (isSettled) query.isSettled = isSettled === 'true';

    if (search) {
      query.$or = [
        { personName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const records = await Udhari.find(query).sort({ dueDate: 1 });

    const allRecords = await Udhari.find({ user: req.user._id });
    let totalReceivable = 0; 
    let totalPayable = 0;    
    let settledAmount = 0;
    let pendingAmount = 0;

    allRecords.forEach(rec => {
      if (rec.isSettled) {
        settledAmount += rec.amount;
      } else {
        pendingAmount += rec.amount;
        if (rec.type === 'Lene Wale') totalReceivable += rec.amount;
        if (rec.type === 'Dene Wale') totalPayable += rec.amount;
      }
    });

    res.status(200).json({
      success: true,
      metrics: {
        totalReceivable,
        totalPayable,
        settledAmount,
        pendingAmount
      },
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle settlement state of credit/debit record
// @route   PATCH /api/v1/udhari/:id/settle
// @access  Private
const toggleSettlement = async (req, res, next) => {
  try {
    const udhari = await Udhari.findOne({ _id: req.params.id, user: req.user._id });

    if (!udhari) {
      res.status(404);
      throw new Error('Record not found');
    }

    udhari.isSettled = !udhari.isSettled;
    await udhari.save();

    // 🔥 AUTO-HISTORY: Record Settlement Status 🔥
    await HistoryLog.create({
      user: req.user._id,
      moduleType: 'Udhari',
      recordId: udhari._id,
      actionType: udhari.isSettled ? (udhari.type === 'Lene Wale' ? 'Received' : 'Paid') : 'Added',
      amount: udhari.amount,
      date: new Date(),
      note: udhari.isSettled ? `Marked as SETTLED. Clear of ₹${udhari.amount}.` : `Re-opened and marked as PENDING.`
    });

    res.status(200).json({ success: true, data: udhari });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete udhari record
// @route   DELETE /api/v1/udhari/:id
// @access  Private
const deleteUdhariRecord = async (req, res, next) => {
  try {
    const udhari = await Udhari.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!udhari) {
      res.status(404);
      throw new Error('Record not found or unauthorized');
    }

    res.status(200).json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addUdhariRecord,
  getUdhariRecords,
  toggleSettlement,
  deleteUdhariRecord,
};