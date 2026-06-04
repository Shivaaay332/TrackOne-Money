import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowUpRight, FiArrowDownRight, FiDollarSign, FiUsers, FiTarget, FiActivity } from 'react-icons/fi';

const StatCard = ({ title, amount, icon: Icon, colorClass, delay, type = 'currency' }) => {
  // Format the display value based on the metric type
  let displayValue = amount;
  if (type === 'currency') {
    displayValue = `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  } else if (type === 'percentage') {
    displayValue = `${Number(amount).toFixed(2)}%`;
  } else {
    displayValue = Number(amount).toLocaleString('en-IN');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="premium-card p-5 flex items-center justify-between bg-white dark:bg-dark-card border-l-4 border-transparent hover:border-primary-500 transition-all"
    >
      <div>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">{title}</p>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white">
          {displayValue}
        </h3>
      </div>
      <div className={`p-3 rounded-xl shadow-sm ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
    </motion.div>
  );
};

const StatCards = ({ summaryData }) => {
  if (!summaryData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mt-6">
      <StatCard 
        title="Total Balance (Savings)" 
        amount={summaryData.totalSavings} 
        icon={FiDollarSign} 
        colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        delay={0}
      />
      <StatCard 
        title="Total Income" 
        amount={summaryData.totalIncome} 
        icon={FiArrowUpRight} 
        colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        delay={0.1}
      />
      <StatCard 
        title="Total Expenses" 
        amount={summaryData.totalExpense} 
        icon={FiArrowDownRight} 
        colorClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        delay={0.2}
      />
      <StatCard 
        title="Udhari Market (Lene/Dene)" 
        amount={summaryData.totalUdhariGiven - summaryData.totalUdhariTaken} 
        icon={FiUsers} 
        colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        delay={0.3}
      />
      {/* Explicitly set type to 'number' to remove currency symbol */}
      <StatCard 
        title="Active Goals" 
        amount={summaryData.activeGoals} 
        icon={FiTarget} 
        colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        delay={0.4}
        type="number" 
      />
      {/* Explicitly set type to 'percentage' */}
      <StatCard 
        title="Goal Progress" 
        amount={summaryData.overallGoalCompletionPercentage} 
        icon={FiActivity} 
        colorClass="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
        delay={0.5}
        type="percentage"
      />
    </div>
  );
};

export default StatCards;