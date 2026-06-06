import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiShield, FiUsers, FiCreditCard, FiTarget } from 'react-icons/fi';

const StatCards = ({ summaryData, reportMode }) => {
  const data = summaryData || {};
  const cards = data.cards || {};
  const extra = data.extraMetrics || {};

  const totalIncome = cards.totalIncome || 0;
  const totalExpenses = cards.totalExpense || cards.totalExpenses || 0;
  const netSavings = totalIncome - totalExpenses; 
  
  const udhariMetrics = cards.udhariMetrics || {};
  const pendingUdhari = udhariMetrics.pendingAmount || 0;
  
  const goalSaved = extra.totalGoalSaved || 0;
  const goalTarget = extra.totalGoalTarget > 0 ? extra.totalGoalTarget : 1;
  const goalPercent = Math.min((goalSaved / goalTarget) * 100, 100).toFixed(1);

  const emiPending = extra.totalEmiPending || 0;
  const isDetailed = reportMode === 'detailed';

  // Helper for formatting
  const formatAmt = (amt) => `₹${Number(amt).toLocaleString('en-IN')}`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
      
      {/* 1. TOTAL SAVINGS */}
      <div className={`premium-card transition-all duration-300 border-l-8 border-blue-500 ${isDetailed ? 'p-6 lg:p-8' : 'p-4'}`}>
        <div className="flex justify-between items-start">
          <div>
            <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isDetailed ? 'text-xs' : 'text-[10px]'}`}>Total Savings</p>
            <h2 className={`font-black text-gray-900 dark:text-white mt-1 ${isDetailed ? 'text-3xl lg:text-4xl' : 'text-xl'}`}>{formatAmt(netSavings)}</h2>
            {/* Detailed View */}
            {isDetailed && <div className="mt-4 flex items-center text-blue-500 font-bold text-sm"><FiShield className="mr-1" /> <span>Safe & Secure</span></div>}
            {/* Compact View Mini-Tag */}
            {!isDetailed && <div className="mt-2 text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded w-max">Net Balance</div>}
          </div>
          <div className={`rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 ${isDetailed ? 'w-14 h-14 lg:w-16 lg:h-16' : 'w-10 h-10'}`}>
            <FiShield size={isDetailed ? 28 : 20} />
          </div>
        </div>
      </div>

      {/* 2. TOTAL INCOME */}
      <div className={`premium-card transition-all duration-300 border-l-8 border-emerald-500 ${isDetailed ? 'p-6 lg:p-8' : 'p-4'}`}>
        <div className="flex justify-between items-start">
          <div>
            <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isDetailed ? 'text-xs' : 'text-[10px]'}`}>Total Income</p>
            <h2 className={`font-black text-gray-900 dark:text-white mt-1 ${isDetailed ? 'text-3xl lg:text-4xl' : 'text-xl'}`}>{formatAmt(totalIncome)}</h2>
            {isDetailed && <div className="mt-4 flex items-center text-emerald-500 font-bold text-sm"><FiTrendingUp className="mr-1" /> <span>Cash Flow</span></div>}
            {!isDetailed && <div className="mt-2 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded w-max">Earnings</div>}
          </div>
          <div className={`rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0 ${isDetailed ? 'w-14 h-14 lg:w-16 lg:h-16' : 'w-10 h-10'}`}>
            <FiTrendingUp size={isDetailed ? 28 : 20} />
          </div>
        </div>
      </div>

      {/* 3. TOTAL EXPENSES */}
      <div className={`premium-card transition-all duration-300 border-l-8 border-rose-500 ${isDetailed ? 'p-6 lg:p-8' : 'p-4'}`}>
        <div className="flex justify-between items-start">
          <div>
            <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isDetailed ? 'text-xs' : 'text-[10px]'}`}>Total Expenses</p>
            <h2 className={`font-black text-gray-900 dark:text-white mt-1 ${isDetailed ? 'text-3xl lg:text-4xl' : 'text-xl'}`}>{formatAmt(totalExpenses)}</h2>
            {isDetailed && (
              <div className="mt-4 w-full bg-gray-200 dark:bg-[#334155] h-2 rounded-full overflow-hidden"><div className="bg-rose-500 h-full w-1/2"></div></div>
            )}
            {!isDetailed && <div className="mt-2 text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded w-max">Spent</div>}
          </div>
          <div className={`rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center shrink-0 ${isDetailed ? 'w-14 h-14 lg:w-16 lg:h-16' : 'w-10 h-10'}`}>
            <FiTrendingDown size={isDetailed ? 28 : 20} />
          </div>
        </div>
      </div>

      {/* 4. UDHARI MARKET */}
      <div className={`premium-card transition-all duration-300 border-l-8 border-amber-500 ${isDetailed ? 'p-6 lg:p-8' : 'p-4'}`}>
        <div className="flex justify-between items-start">
          <div className="w-full">
            <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isDetailed ? 'text-xs' : 'text-[10px]'}`}>Pending Udhari</p>
            <h2 className={`font-black text-gray-900 dark:text-white mt-1 ${isDetailed ? 'text-3xl lg:text-4xl' : 'text-xl'}`}>{formatAmt(pendingUdhari)}</h2>
            {isDetailed && (
              <div className="mt-4 grid grid-cols-2 gap-2 border-t dark:border-[#334155] pt-4 w-full">
                <div><p className="text-[9px] text-gray-400 font-bold uppercase">To Receive</p><p className="text-emerald-500 font-bold text-sm">{formatAmt(udhariMetrics.totalReceivable || 0)}</p></div>
                <div><p className="text-[9px] text-gray-400 font-bold uppercase">To Give</p><p className="text-rose-500 font-bold text-sm">{formatAmt(udhariMetrics.totalPayable || 0)}</p></div>
              </div>
            )}
            {!isDetailed && <div className="mt-2 text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded w-max">{formatAmt(udhariMetrics.totalReceivable || 0)} To Get</div>}
          </div>
          <div className={`rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0 ${isDetailed ? 'w-14 h-14 lg:w-16 lg:h-16' : 'w-10 h-10'}`}>
            <FiUsers size={isDetailed ? 28 : 20} />
          </div>
        </div>
      </div>

      {/* 5. FUTURE GOALS */}
      <div className={`premium-card transition-all duration-300 border-l-8 border-purple-500 ${isDetailed ? 'p-6 lg:p-8' : 'p-4'}`}>
        <div className="flex justify-between items-start">
          <div>
            <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isDetailed ? 'text-xs' : 'text-[10px]'}`}>Future Goals</p>
            <h2 className={`font-black text-gray-900 dark:text-white mt-1 ${isDetailed ? 'text-3xl lg:text-4xl' : 'text-xl'}`}>{formatAmt(goalSaved)}</h2>
            {isDetailed && <div className="mt-4 flex items-center text-purple-500 font-bold text-sm"><FiTarget className="mr-1" /> <span>{goalPercent}% Achieved</span></div>}
            {!isDetailed && <div className="mt-2 text-[9px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded w-max">{goalPercent}% Done</div>}
          </div>
          <div className={`rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0 ${isDetailed ? 'w-14 h-14 lg:w-16 lg:h-16' : 'w-10 h-10'}`}>
            <FiTarget size={isDetailed ? 28 : 20} />
          </div>
        </div>
      </div>

      {/* 6. EMI OUTSTANDING */}
      <div className={`premium-card transition-all duration-300 border-l-8 border-indigo-500 ${isDetailed ? 'p-6 lg:p-8' : 'p-4'}`}>
        <div className="flex justify-between items-start">
          <div>
            <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isDetailed ? 'text-xs' : 'text-[10px]'}`}>EMI Pending</p>
            <h2 className={`font-black text-gray-900 dark:text-white mt-1 ${isDetailed ? 'text-3xl lg:text-4xl' : 'text-xl'}`}>{formatAmt(emiPending)}</h2>
            {isDetailed && <div className="mt-4 flex flex-col gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-bold"><span>Remaining Principal</span></div>}
            {!isDetailed && <div className="mt-2 text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded w-max">{extra.emis?.filter(e => e.status !== 'Closed').length || 0} Active Loans</div>}
          </div>
          <div className={`rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0 ${isDetailed ? 'w-14 h-14 lg:w-16 lg:h-16' : 'w-10 h-10'}`}>
            <FiCreditCard size={isDetailed ? 28 : 20} />
          </div>
        </div>
      </div>

    </div>
  );
};

export default StatCards;