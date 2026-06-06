import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiUsers, FiCreditCard } from 'react-icons/fi';

const StatCards = ({ summaryData, reportMode }) => {
  // Agar data nahi aaya (loading state), toh default fallback object
  const data = summaryData || {};

  // 100% Safe Variables (Backend keys ke mismatches aur undefined ko handle karne ke liye)
  const totalIncome = data.totalIncome || 0;
  const totalExpenses = data.totalExpense || data.totalExpenses || 0; // Fix here
  const pendingUdhari = data.udhariMetrics?.pendingAmount || 0;
  const totalReceivable = data.udhariMetrics?.totalReceivable || 0;
  const totalPayable = data.udhariMetrics?.totalPayable || 0;
  const activeEmis = data.emiMetrics?.totalActive || 0;
  const emiBurden = data.emiMetrics?.monthlyBurden || 0;

  const isDetailed = reportMode === 'detailed';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* 1. INCOME CARD */}
      <div className={`premium-card transition-all duration-300 border-l-8 border-emerald-500 ${isDetailed ? 'p-8' : 'p-4'}`}>
        <div className="flex justify-between items-start">
          <div>
            <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isDetailed ? 'text-xs' : 'text-[10px]'}`}>
              Total Income
            </p>
            <h2 className={`font-black text-gray-900 dark:text-white mt-1 ${isDetailed ? 'text-4xl' : 'text-2xl'}`}>
              ₹{totalIncome.toLocaleString()}
            </h2>
            {isDetailed && (
              <div className="mt-4 flex items-center text-emerald-500 font-bold text-sm">
                <FiTrendingUp className="mr-1" /> <span>Cash Flow Positive</span>
              </div>
            )}
          </div>
          <div className={`rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center ${isDetailed ? 'w-16 h-16' : 'w-10 h-10'}`}>
            <FiTrendingUp size={isDetailed ? 32 : 20} />
          </div>
        </div>
      </div>

      {/* 2. EXPENSES CARD (Fixed) */}
      <div className={`premium-card transition-all duration-300 border-l-8 border-rose-500 ${isDetailed ? 'p-8' : 'p-4'}`}>
        <div className="flex justify-between items-start">
          <div>
            <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isDetailed ? 'text-xs' : 'text-[10px]'}`}>
              Total Expenses
            </p>
            <h2 className={`font-black text-gray-900 dark:text-white mt-1 ${isDetailed ? 'text-4xl' : 'text-2xl'}`}>
              ₹{totalExpenses.toLocaleString()}
            </h2>
            {isDetailed && (
              <div className="mt-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Activity Indicator</p>
                <div className="w-full bg-gray-200 dark:bg-[#334155] h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full w-1/2"></div>
                </div>
              </div>
            )}
          </div>
          <div className={`rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center ${isDetailed ? 'w-16 h-16' : 'w-10 h-10'}`}>
            <FiTrendingDown size={isDetailed ? 32 : 20} />
          </div>
        </div>
      </div>

      {/* 3. UDHARI CARD */}
      <div className={`premium-card transition-all duration-300 border-l-8 border-amber-500 ${isDetailed ? 'p-8' : 'p-4'}`}>
        <div className="flex justify-between items-start">
          <div className="w-full">
            <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isDetailed ? 'text-xs' : 'text-[10px]'}`}>
              Udhari Market
            </p>
            <h2 className={`font-black text-gray-900 dark:text-white mt-1 ${isDetailed ? 'text-4xl' : 'text-2xl'}`}>
              ₹{pendingUdhari.toLocaleString()}
            </h2>
            {isDetailed && (
              <div className="mt-4 grid grid-cols-2 gap-4 border-t dark:border-[#334155] pt-4 w-full">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">To Receive</p>
                  <p className="text-emerald-500 font-bold text-sm">₹{totalReceivable.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">To Give</p>
                  <p className="text-rose-500 font-bold text-sm">₹{totalPayable.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
          <div className={`rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0 ${isDetailed ? 'w-16 h-16' : 'w-10 h-10'}`}>
            <FiUsers size={isDetailed ? 32 : 20} />
          </div>
        </div>
      </div>

      {/* 4. EMI CARD */}
      <div className={`premium-card transition-all duration-300 border-l-8 border-indigo-500 ${isDetailed ? 'p-8' : 'p-4'}`}>
        <div className="flex justify-between items-start">
          <div>
            <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isDetailed ? 'text-xs' : 'text-[10px]'}`}>
              Active EMIs
            </p>
            <h2 className={`font-black text-gray-900 dark:text-white mt-1 ${isDetailed ? 'text-4xl' : 'text-2xl'}`}>
              {activeEmis} Loans
            </h2>
            {isDetailed && (
              <div className="mt-4">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                  Monthly Burden: ₹{emiBurden.toLocaleString()}
                </p>
                <div className="mt-2 text-[10px] bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-indigo-700 dark:text-indigo-300 font-medium">
                  Track installments to avoid late fees.
                </div>
              </div>
            )}
          </div>
          <div className={`rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0 ${isDetailed ? 'w-16 h-16' : 'w-10 h-10'}`}>
            <FiCreditCard size={isDetailed ? 32 : 20} />
          </div>
        </div>
      </div>

    </div>
  );
};

export default StatCards;