const mongoose = require('mongoose');

const udhariSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: [true, 'Record type is required'],
      enum: ['Lene Wale', 'Dene Wale'], // Lene Wale = Receivable, Dene Wale = Payable
    },
    personName: {
      type: String,
      required: [true, 'Person name is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Udhari amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    date: {
      type: Date,
      required: [true, 'Date issued is required'],
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isSettled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Udhari', udhariSchema);