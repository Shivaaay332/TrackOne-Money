import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowUpRight, FiArrowDownRight, FiDollarSign, FiUsers, FiTarget, FiActivity } from 'react-icons/fi';

const StatCard = ({ title, amount, icon: Icon, colorClass, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="premium-card p-5 flex items-center justify-between"
  >
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
        ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </h3>
    </div>
    <div className={`p-3 rounded-xl ${colorClass}`}>
      <Icon className="h-6 w-6" />
    </div>
  </motion.div>
);

const StatCards = ({ summaryData }) => {
  if (!summaryData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mt-6">
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
      <StatCard 
        title="Active Goals" 
        amount={summaryData.activeGoals} 
        icon={FiTarget} 
        colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        delay={0.4}
      />
      <StatCard 
        title="Goal Completion" 
        amount={summaryData.overallGoalCompletionPercentage} 
        icon={FiActivity} 
        colorClass="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
        delay={0.5}
      />
    </div>
  );
};

export default StatCards;