const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    goalName: {
      type: String,
      required: [true, 'Goal designation name is required'],
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target monetary amount is required'],
      min: [0.01, 'Target must be greater than 0'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative'],
    },
    targetMonth: {
      type: String, // Stored as "YYYY-MM"
      required: [true, 'Target completion timeline month is required'],
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    priorityLevel: {
      type: String,
      required: [true, 'Priority metric classification is required'],
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Goal', goalSchema);