const mongoose = require('mongoose');

const historyLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleType: { type: String, enum: ['Goal', 'Udhari', 'EMI'], required: true },
  recordId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Jis Goal/EMI/Udhari ka hai uski ID
  actionType: { type: String, enum: ['Paid', 'Received', 'Withdrawn', 'Added'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String, default: '' },
  receiptImage: { type: String, default: '' } // Photo/Receipt ka link
}, { timestamps: true });

module.exports = mongoose.model('HistoryLog', historyLogSchema);