import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiShield, FiUsers, FiCreditCard, FiTarget } from 'react-icons/fi';
import { CHART_COLORS, formatINR } from './dashboardTheme';

const StatCards = ({ summaryData, reportPeriod }) => {
  const data = summaryData || {};
  const cards = data.cards || {};
  const extra = data.extraMetrics || {};

  const totalIncome = Number(cards.totalIncome) || 0;
  const totalExpenses = Number(cards.totalExpense || cards.totalExpenses) || 0;
  const netSavings = totalIncome - totalExpenses;
  const incomeCount = cards.incomeCount || 0;
  const expenseCount = cards.expenseCount || 0;

  const udhariMetrics = cards.udhariMetrics || {};
  const pendingUdhari = udhariMetrics.pendingAmount || 0;
  const totalReceivable = udhariMetrics.totalReceivable || 0;
  const totalPayable = udhariMetrics.totalPayable || 0;

  const activeEmis = cards.emiMetrics?.totalActive || 0;
  const emiBurden = cards.emiMetrics?.monthlyBurden || 0;

  const goalSaved = extra.totalGoalSaved || 0;
  const goalTarget = extra.totalGoalTarget || 0;
  const goalPercent = goalTarget > 0 ? Math.min((goalSaved / goalTarget) * 100, 100).toFixed(1) : '0.0';
  const emiPending = extra.totalEmiPending || 0;

  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0.0';
  const expenseRatio = totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(1) : '0.0';

  const periodTag =
    reportPeriod === 'All Time' ? 'All time' : reportPeriod === 'This Year' ? 'This year' : 'This month';

  const cards_config = [
    {
      key: 'savings',
      label: 'Net Savings',
      value: formatINR(netSavings),
      color: CHART_COLORS.savings,
      icon: FiShield,
      extra: (
        <div className="mt-2 space-y-1.5">
          <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>Savings rate</span>
            <span className="font-bold text-gray-700 dark:text-gray-200">{savingsRate}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: CHART_COLORS.savings }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Math.max(Number(savingsRate), 0), 100)}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[10px] text-gray-400">{periodTag} · Income − Expenses</p>
        </div>
      ),
    },
    {
      key: 'income',
      label: 'Total Income',
      value: formatINR(totalIncome),
      color: CHART_COLORS.income,
      icon: FiTrendingUp,
      extra: (
        <div className="mt-2 space-y-1">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            <span className="font-bold text-emerald-600">{incomeCount}</span> income records in{' '}
            {periodTag.toLowerCase()}
          </p>
          {totalIncome > 0 && (
            <p className="text-[10px] text-gray-400">
              Avg per entry: {formatINR(Math.round(totalIncome / Math.max(incomeCount, 1)))}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'expenses',
      label: 'Total Expenses',
      value: formatINR(totalExpenses),
      color: CHART_COLORS.expense,
      icon: FiTrendingDown,
      extra: (
        <div className="mt-2 space-y-1.5">
          <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>Of total income</span>
            <span className="font-bold text-rose-500">{expenseRatio}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-rose-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Number(expenseRatio), 100)}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
            />
          </div>
          <p className="text-[10px] text-gray-400">
            {expenseCount} expense {expenseCount === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      ),
    },
    {
      key: 'udhari',
      label: 'Udhari Pending',
      value: formatINR(pendingUdhari),
      color: CHART_COLORS.udhari,
      icon: FiUsers,
      extra: (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
            <p className="text-[9px] text-gray-500 uppercase font-bold">To Receive</p>
            <p className="text-sm font-bold text-emerald-600">{formatINR(totalReceivable)}</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-2">
            <p className="text-[9px] text-gray-500 uppercase font-bold">To Give</p>
            <p className="text-sm font-bold text-rose-500">{formatINR(totalPayable)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'goals',
      label: 'Goals Saved',
      value: formatINR(goalSaved),
      color: CHART_COLORS.goals,
      icon: FiTarget,
      extra: (
        <div className="mt-2 space-y-1.5">
          <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>Target: {formatINR(goalTarget)}</span>
            <span className="font-bold text-purple-600">{goalPercent}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Number(goalPercent), 100)}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
          <p className="text-[10px] text-gray-400">{(extra.goals || []).length} active goals</p>
        </div>
      ),
    },
    {
      key: 'emi',
      label: 'EMI Pending',
      value: formatINR(emiPending),
      color: CHART_COLORS.emi,
      icon: FiCreditCard,
      extra: (
        <div className="mt-2 space-y-1">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            <span className="font-bold text-indigo-600">{activeEmis}</span> active EMIs
          </p>
          <p className="text-[10px] text-gray-400">Monthly burden: {formatINR(emiBurden)}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {cards_config.map(({ key, label, value, color, icon: Icon, extra }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="premium-card rounded-xl border border-gray-100 dark:border-slate-700/80 overflow-hidden p-4 sm:p-5 relative"
          style={{ boxShadow: `0 4px 20px ${color}12` }}
        >
          <div
            className="absolute top-0 left-0 w-full h-1 rounded-t-xl"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
          />
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
                {label}
              </p>
              <h2 className="font-bold text-gray-900 dark:text-white mt-0.5 truncate text-xl sm:text-2xl">{value}</h2>
              {extra}
            </div>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <Icon size={20} />
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatCards;
