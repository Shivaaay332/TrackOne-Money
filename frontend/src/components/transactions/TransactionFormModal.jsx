import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUploadCloud } from 'react-icons/fi';

const EXPENSE_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Education', 'Health', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Business', 'Investment', 'Gift', 'Freelance', 'Other'];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Wallet'];

const TransactionFormModal = ({ isOpen, onClose, type, editData, onSave }) => {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    source: '', // Income only
    paymentMethod: 'Cash', // Expense only
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        amount: editData.amount || '',
        category: editData.category || '',
        date: new Date(editData.date).toISOString().split('T')[0],
        notes: editData.notes || '',
        source: editData.source || '',
        paymentMethod: editData.paymentMethod || 'Cash',
      });
    } else {
      setFormData({
        amount: '',
        category: type === 'expense' ? 'Food' : 'Salary',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        source: '',
        paymentMethod: 'Cash',
      });
    }
    setFile(null);
  }, [editData, type, isOpen]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    submitData.append('amount', formData.amount);
    submitData.append('category', formData.category);
    submitData.append('date', formData.date);
    submitData.append('notes', formData.notes);
    
    if (type === 'income') {
      submitData.append('source', formData.source);
    } else {
      submitData.append('paymentMethod', formData.paymentMethod);
    }

    if (file) {
      submitData.append('receipt', file);
    }

    await onSave(submitData, editData?._id);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-dark-border"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {editData ? 'Edit' : 'Add'} {type === 'income' ? 'Income' : 'Expense'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
                <input type="number" name="amount" required min="0.01" step="0.01" value={formData.amount} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input type="date" name="date" required value={formData.date} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select name="category" required value={formData.category} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="" disabled>Select Category</option>
                {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {type === 'income' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source (e.g. Salary, Client Name)</label>
                <input type="text" name="source" required value={formData.source} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                <select name="paymentMethod" required value={formData.paymentMethod} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none">
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes / Description</label>
              <textarea name="notes" rows="2" value={formData.notes} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Optional details..."></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Receipt (Optional)</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-dark-bg hover:bg-gray-100 dark:border-dark-border dark:hover:border-gray-500 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiUploadCloud className="w-6 h-6 text-gray-500 dark:text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {file ? <span className="font-semibold text-primary-500">{file.name}</span> : "Click to upload image/PDF"}
                    </p>
                  </div>
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
                </label>
              </div>
            </div>

            <div className="pt-4 flex space-x-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-600 transition-colors disabled:opacity-70">
                {loading ? 'Saving...' : 'Save Transaction'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TransactionFormModal;