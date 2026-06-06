import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiLoader, FiFileText } from 'react-icons/fi';
import api from '../services/api';
import { generateProfessionalReport } from '../utils/pdfGenerator';

import StatCards from '../components/dashboard/StatCards';
import AnalyticsCharts from '../components/dashboard/AnalyticsCharts';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const [reportPeriod, setReportPeriod] = useState('This Month'); 
  const [reportMode, setReportMode] = useState('compact'); 

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let query = '';
      if (reportPeriod === 'This Month') {
        const start = new Date(); start.setDate(1);
        const end = new Date(); end.setMonth(end.getMonth() + 1, 0);
        query = `?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      } else if (reportPeriod === 'This Year') {
        const start = new Date(new Date().getFullYear(), 0, 1);
        const end = new Date(new Date().getFullYear(), 11, 31);
        query = `?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      }
      const response = await api.get(`/dashboard/summary${query}`);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard summary", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line
  }, [reportPeriod]);

  // Completely Native PDF Generation (No Screenshots)
  const handleExportPDF = async () => {
    if (!dashboardData) return;
    setIsExporting(true);
    try {
      // 🔥 MAGIC FIX: PDF Crash ko rokne ke liye safe data mapping 🔥
      // PDF generator undefined data milne par crash ho raha tha.
      // Hum yahan fallback (|| 0) laga kar bhejenge taaki wo smoothly chale.
      const safeDataForPDF = {
        totalIncome: dashboardData?.cards?.totalIncome || 0,
        totalExpenses: dashboardData?.cards?.totalExpenses || 0,
        totalExpense: dashboardData?.cards?.totalExpenses || 0,
        udhariMetrics: dashboardData?.cards?.udhariMetrics || {},
        emiMetrics: dashboardData?.cards?.emiMetrics || {},
        cards: dashboardData?.cards || {},
        charts: dashboardData?.charts || {},
        ...dashboardData 
      };

      // Ab PDF Generator ko perfectly formatted data milega
      await generateProfessionalReport(safeDataForPDF, user, reportPeriod, reportMode);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert('Failed to generate professional report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex h-full items-center justify-center">
        <FiLoader className="animate-spin h-10 w-10 text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your money, udhari, and goals.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-auto">
            <select 
              value={reportMode}
              onChange={(e) => setReportMode(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] text-gray-700 dark:text-gray-200 py-2.5 pl-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer text-sm font-medium"
            >
              <option value="compact">Compact Layout</option>
              <option value="detailed">Detailed Layout</option>
            </select>
          </div>

          <div className="relative w-full sm:w-auto">
            <select 
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] text-gray-700 dark:text-gray-200 py-2.5 pl-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer text-sm font-medium"
            >
              <option value="All Time">All Time</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          <button 
            onClick={handleExportPDF} 
            disabled={isExporting}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-2.5 px-6 rounded-xl shadow-md transition-all font-semibold disabled:opacity-70 whitespace-nowrap"
          >
            {isExporting ? <FiLoader className="animate-spin h-5 w-5" /> : <FiFileText className="h-5 w-5" />}
            <span>{isExporting ? 'Generating...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <StatCards summaryData={dashboardData?.cards} reportMode={reportMode} />
        {dashboardData && (
          <div id="analytics-charts-container" className="bg-transparent">
            <AnalyticsCharts 
              monthlyTrend={dashboardData.charts?.monthlyTrend} 
              expenseByCategory={dashboardData.charts?.expenseByCategory} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;