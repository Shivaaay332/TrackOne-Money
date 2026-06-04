import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const UdhariFormModal = ({ isOpen, onClose, type, editData, onSave }) => {
  const [formData, setFormData] = useState({
    type: 'Lene Wale', // Lene Wale (Receivable) or Dene Wale (Payable)
    personName: '',
    phoneNumber: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        type: editData.type,
        personName: editData.personName,
        phoneNumber: editData.phoneNumber,
        amount: editData.amount,
        date: new Date(editData.date).toISOString().split('T')[0],
        dueDate: new Date(editData.dueDate).toISOString().split('T')[0],
        description: editData.description || '',
      });
    } else {
      setFormData({
        type: type === 'lene' ? 'Lene Wale' : 'Dene Wale',
        personName: '',
        phoneNumber: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        description: '',
      });
    }
  }, [editData, type, isOpen]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData, editData?._id);
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
              {editData ? 'Edit Record' : `Add ${formData.type} Record`}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Person Name</label>
                <input type="text" name="personName" required value={formData.personName} onChange={handleChange} placeholder="e.g. Rahul" className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange} placeholder="10-digit number" className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
              <input type="number" name="amount" required min="0.01" step="0.01" value={formData.amount} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Given/Taken Date</label>
                <input type="date" name="date" required value={formData.date} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                <input type="date" name="dueDate" required value={formData.dueDate} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description / Reason</label>
              <textarea name="description" rows="2" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Reason for udhari..."></textarea>
            </div>

            <div className="pt-4 flex space-x-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-600 transition-colors disabled:opacity-70">
                {loading ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UdhariFormModal;