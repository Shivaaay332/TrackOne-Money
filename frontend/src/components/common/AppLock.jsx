import React, { useState } from 'react';
import { FiLock, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../../services/api';

const AppLock = ({ onUnlock, userName }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) return setError("Enter a 4-digit PIN");
    
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-pin', { pin });
      onUnlock();
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F4F7FE] dark:bg-[#0f172a] p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="premium-card p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiLock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">App Locked</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Welcome back, {userName}! Please enter your PIN to access TrackOne-Money.</p>
        
        {error && (
          <div className="mb-4 flex items-center justify-center text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-2 rounded-lg">
            <FiAlertCircle className="mr-2" /> {error}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <input 
            type="password" 
            maxLength="4"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center tracking-[1em] text-2xl font-bold px-4 py-3 rounded-xl border border-gray-300 dark:border-[#334155] bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none mb-6 shadow-inner" 
            placeholder="••••"
          />
          <button type="submit" disabled={loading || pin.length !== 4} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 disabled:opacity-60 transition-all">
            {loading ? 'Verifying...' : 'Unlock App'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AppLock;