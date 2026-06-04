import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';

const FundModal = ({ isOpen, onClose, goal, onSave }) => {
  const [amount, setAmount] = useState('');
  const [actionType, setActionType] = useState('add'); // 'add' or 'withdraw'
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(goal._id, amount, actionType);
    setLoading(false);
    setAmount('');
  };

  if (!isOpen || !goal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-dark-border"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Manage Funds</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Goal</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{goal.goalName}</p>
              <p className="text-sm mt-1">
                Current: <span className="font-semibold text-emerald-500">₹{goal.currentAmount.toLocaleString()}</span> / ₹{goal.targetAmount.toLocaleString()}
              </p>
            </div>

            <div className="flex bg-gray-100 dark:bg-dark-bg p-1 rounded-xl">
              <button type="button" onClick={() => setActionType('add')} className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-all ${actionType === 'add' ? 'bg-white dark:bg-dark-card text-emerald-600 shadow-sm' : 'text-gray-500'}`}>
                <FiArrowUpRight className="mr-1" /> Add Funds
              </button>
              <button type="button" onClick={() => setActionType('withdraw')} className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-all ${actionType === 'withdraw' ? 'bg-white dark:bg-dark-card text-red-600 shadow-sm' : 'text-gray-500'}`}>
                <FiArrowDownRight className="mr-1" /> Withdraw
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
              <input type="number" required min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 text-lg font-bold rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-center" placeholder="0" />
            </div>

            <button type="submit" disabled={loading} className={`w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-70 ${actionType === 'add' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
              {loading ? 'Processing...' : (actionType === 'add' ? 'Deposit Funds' : 'Withdraw Funds')}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FundModal;