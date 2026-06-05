const mongoose = require('mongoose');

const emiSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emiName: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ['Home Loan', 'Car Loan', 'Bike Loan', 'Mobile EMI', 'Personal Loan', 'Education Loan', 'Business Loan', 'Credit Card EMI', 'Appliance EMI', 'Other'] },
  lenderName: { type: String, required: true, trim: true },
  principalAmount: { type: Number, required: true, min: 1 },
  interestRate: { type: Number, required: true, min: 0 },
  tenureMonths: { type: Number, required: true, min: 1 },
  emiAmount: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  nextDueDate: { type: Date, required: true },
  totalPaidAmount: { type: Number, default: 0 },
  paidInstallments: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Upcoming', 'Overdue', 'Closed'], default: 'Active' },
  notes: { type: String, default: '', trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Emi', emiSchema);