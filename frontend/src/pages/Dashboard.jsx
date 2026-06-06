import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FiTrendingUp, FiTrendingDown, FiUsers, FiCreditCard, 
  FiPieChart, FiArrowRight, FiFileText, FiTarget 
} from 'react-icons/fi';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // YEH HAI MAIN STATE
  const [layoutMode, setLayoutMode] = useState('compact'); 

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/dashboard');
      setMetrics(data.data);
    } catch (error) {
      console.error("Dashboard error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleExportPDF = () => {
    window.print(); // Simple print for now, or link to your PDF generator
  };

  if (loading) return <div className="p-10 text-center dark:text-white">Loading Financial Intelligence...</div>;

  return (
    <div className="pb-10 space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track your money, udhari, and goals.</p>
        </div>
        <button 
          onClick={handleExportPDF}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all"
        >
          <FiFileText /> <span>Export PDF</span>
        </button>
      </div>

      {/* 2. LAYOUT TOGGLE BOX (Isme logic link kar diya hai) */}
      <div className="premium-card p-4 bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155]">
        <div className="flex flex-col gap-3">
          <label className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${layoutMode === 'compact' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-[#0f172a] dark:text-gray-300'}`}>
            <span className="font-bold">Compact Layout</span>
            <input 
              type="radio" 
              name="layout" 
              checked={layoutMode === 'compact'} 
              onChange={() => setLayoutMode('compact')}
              className="w-5 h-5 accent-white" 
            />
          </label>
          <label className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${layoutMode === 'detailed' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-[#0f172a] dark:text-gray-300'}`}>
            <span className="font-bold">Detailed Layout</span>
            <input 
              type="radio" 
              name="layout" 
              checked={layoutMode === 'detailed'} 
              onChange={() => setLayoutMode('detailed')}
              className="w-5 h-5 accent-white" 
            />
          </label>
        </div>
      </div>

      {/* 3. MAIN CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TOTAL INCOME CARD */}
        <div className={`premium-card transition-all duration-300 border-l-8 border-emerald-500 ${layoutMode === 'compact' ? 'p-4' : 'p-8'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${layoutMode === 'compact' ? 'text-[10px]' : 'text-xs'}`}>
                Total Income
              </p>
              <h2 className={`font-black text-gray-900 dark:text-white mt-1 ${layoutMode === 'compact' ? 'text-2xl' : 'text-4xl'}`}>
                ₹{metrics?.totalIncome?.toLocaleString() || 0}
              </h2>
              {/* Detailed Extra Info */}
              {layoutMode === 'detailed' && (
                <div className="mt-4 flex items-center text-emerald-500 font-bold text-sm">
                  <FiTrendingUp className="mr-1" /> <span>+0% from last month</span>
                </div>
              )}
            </div>
            <div className={`rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center ${layoutMode === 'compact' ? 'w-10 h-10' : 'w-16 h-16'}`}>
              <FiTrendingUp size={layoutMode === 'compact' ? 20 : 32} />
            </div>
          </div>
        </div>

        {/* TOTAL EXPENSES CARD */}
        <div className={`premium-card transition-all duration-300 border-l-8 border-rose-500 ${layoutMode === 'compact' ? 'p-4' : 'p-8'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${layoutMode === 'compact' ? 'text-[10px]' : 'text-xs'}`}>
                Total Expenses
              </p>
              <h2 className={`font-black text-gray-900 dark:text-white mt-1 ${layoutMode === 'compact' ? 'text-2xl' : 'text-4xl'}`}>
                ₹{metrics?.totalExpenses?.toLocaleString() || 0}
              </h2>
              {/* Detailed Extra Info */}
              {layoutMode === 'detailed' && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: '45%' }}></div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase">Budget Utilization: 45%</p>
                </div>
              )}
            </div>
            <div className={`rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center ${layoutMode === 'compact' ? 'w-10 h-10' : 'w-16 h-16'}`}>
              <FiTrendingDown size={layoutMode === 'compact' ? 20 : 32} />
            </div>
          </div>
        </div>

        {/* UDHARI MARKET CARD */}
        <div className={`premium-card transition-all duration-300 border-l-8 border-amber-500 ${layoutMode === 'compact' ? 'p-4' : 'p-8'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${layoutMode === 'compact' ? 'text-[10px]' : 'text-xs'}`}>
                Udhari Market
              </p>
              <h2 className={`font-black text-gray-900 dark:text-white mt-1 ${layoutMode === 'compact' ? 'text-2xl' : 'text-4xl'}`}>
                ₹{metrics?.udhariMetrics?.pendingAmount?.toLocaleString() || 0}
              </h2>
              {/* Detailed Extra Info */}
              {layoutMode === 'detailed' && (
                <div className="mt-4 grid grid-cols-2 gap-4 border-t dark:border-gray-700 pt-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">To Receive</p>
                    <p className="text-emerald-500 font-bold">₹{metrics?.udhariMetrics?.totalReceivable || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">To Give</p>
                    <p className="text-rose-500 font-bold">₹{metrics?.udhariMetrics?.totalPayable || 0}</p>
                  </div>
                </div>
              )}
            </div>
            <div className={`rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center ${layoutMode === 'compact' ? 'w-10 h-10' : 'w-16 h-16'}`}>
              <FiUsers size={layoutMode === 'compact' ? 20 : 32} />
            </div>
          </div>
        </div>

        {/* ACTIVE EMIS CARD */}
        <div className={`premium-card transition-all duration-300 border-l-8 border-indigo-500 ${layoutMode === 'compact' ? 'p-4' : 'p-8'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${layoutMode === 'compact' ? 'text-[10px]' : 'text-xs'}`}>
                Active EMIs
              </p>
              <h2 className={`font-black text-gray-900 dark:text-white mt-1 ${layoutMode === 'compact' ? 'text-2xl' : 'text-4xl'}`}>
                {metrics?.emiMetrics?.totalActive || 0} Loans
              </h2>
              {/* Detailed Extra Info */}
              {layoutMode === 'detailed' && (
                <div className="mt-4">
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">
                    Monthly Burden: ₹{metrics?.emiMetrics?.monthlyBurden?.toLocaleString() || 0}
                  </p>
                  <div className="mt-2 text-[10px] bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-indigo-700 dark:text-indigo-300 font-medium italic">
                    "Track installments to avoid late fees."
                  </div>
                </div>
              )}
            </div>
            <div className={`rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center ${layoutMode === 'compact' ? 'w-10 h-10' : 'w-16 h-16'}`}>
              <FiCreditCard size={layoutMode === 'compact' ? 20 : 32} />
            </div>
          </div>
        </div>

      </div>

      {/* 4. SAVINGS GOAL PROGRESS (Only in Detailed) */}
      {layoutMode === 'detailed' && metrics?.topGoal && (
        <div className="premium-card p-6 border-t-4 border-blue-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold dark:text-white flex items-center">
              <FiTarget className="mr-2 text-blue-600" /> Goal Spotlight: {metrics.topGoal.name}
            </h3>
            <span className="text-blue-600 font-black">{Math.round((metrics.topGoal.saved / metrics.topGoal.target) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-4 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-1000" 
              style={{ width: `${(metrics.topGoal.saved / metrics.topGoal.target) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-bold uppercase">₹{metrics.topGoal.saved.toLocaleString()} saved of ₹{metrics.topGoal.target.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;