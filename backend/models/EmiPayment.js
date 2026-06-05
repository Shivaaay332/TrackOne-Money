const mongoose = require('mongoose');

const emiPaymentSchema = new mongoose.Schema({
  emiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emi', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amountPaid: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Paid', 'Partially Paid'], default: 'Paid' },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('EmiPayment', emiPaymentSchema);