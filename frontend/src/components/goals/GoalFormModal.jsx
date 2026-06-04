import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const GoalFormModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    goalName: '',
    targetAmount: '',
    targetMonth: '',
    reason: '',
    notes: '',
    priorityLevel: 'Medium',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
    // Reset form after save
    setFormData({ goalName: '', targetAmount: '', targetMonth: '', reason: '', notes: '', priorityLevel: 'Medium' });
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
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Create New Goal</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal Name</label>
              <input type="text" name="goalName" required value={formData.goalName} onChange={handleChange} placeholder="e.g. Dream Car, Emergency Fund" className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Amount (₹)</label>
                <input type="number" name="targetAmount" required min="1" step="1" value={formData.targetAmount} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Month</label>
                <input type="month" name="targetMonth" required value={formData.targetMonth} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select name="priorityLevel" value={formData.priorityLevel} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (Optional)</label>
                <input type="text" name="reason" value={formData.reason} onChange={handleChange} placeholder="Why is this important?" className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea name="notes" rows="2" value={formData.notes} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Any additional plans..."></textarea>
            </div>

            <div className="pt-4 flex space-x-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition-colors disabled:opacity-70">
                {loading ? 'Creating...' : 'Create Goal'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GoalFormModal;