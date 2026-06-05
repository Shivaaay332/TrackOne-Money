import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail } from 'react-icons/fi';
import api from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/forgot-password', { email });
      setStatus('Success! Check your email for a reset link.');
    } catch (error) {
      setStatus('Error processing request.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="premium-card w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">Reset Password</h2>
        {status && <p className="text-center text-primary-600 mb-4">{status}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <FiMail className="absolute top-4 left-3 text-gray-400" />
            <input type="email" required placeholder="Email Address" className="block w-full pl-10 pr-3 py-3 border dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-white" onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700">Send Reset Link</button>
        </form>
        <Link to="/login" className="block text-center mt-6 text-sm text-gray-600 dark:text-gray-400">Back to Login</Link>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;