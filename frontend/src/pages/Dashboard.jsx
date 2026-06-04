import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiPrinter, FiFilter, FiLoader } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import api from '../services/api';

import StatCards from '../components/dashboard/StatCards';
import AnalyticsCharts from '../components/dashboard/AnalyticsCharts';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all'); // all, month, year

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let query = '';
      if (dateRange === 'month') {
        const start = new Date(); start.setDate(1);
        const end = new Date(); end.setMonth(end.getMonth() + 1, 0);
        query = `?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      } else if (dateRange === 'year') {
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
  }, [dateRange]);

  // Export to PDF using html2canvas & jsPDF
  const exportPDF = async () => {
    const dashboardElement = document.getElementById('dashboard-print-area');
    if (!dashboardElement) return;

    try {
      const canvas = await html2canvas(dashboardElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TrackOne_Report_${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex h-full items-center justify-center">
        <FiLoader className="animate-spin h-10 w-10 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your money, udhari, and goals.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Filter Dropdown */}
          <div className="relative">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-200 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <FiFilter className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <button onClick={handlePrint} className="p-2.5 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-border shadow-sm transition-colors tooltip" title="Print Dashboard">
            <FiPrinter className="h-5 w-5" />
          </button>

          <button onClick={exportPDF} className="flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white py-2 px-4 rounded-lg shadow-sm transition-all font-medium">
            <FiDownload className="h-4 w-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Area Wrapper */}
      <div id="dashboard-print-area" className="print:bg-white print:text-black">
        <StatCards summaryData={dashboardData?.cards} />
        
        {dashboardData && (
          <AnalyticsCharts 
            monthlyTrend={dashboardData.charts.monthlyTrend} 
            expenseByCategory={dashboardData.charts.expenseByCategory} 
          />
        )}

        {/* Recent Transactions Snippet */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Incomes */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="premium-card p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b dark:border-dark-border pb-2">Recent Income</h3>
            <div className="space-y-4">
              {dashboardData?.recentTransactions?.incomes?.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent income records.</p>
              ) : (
                dashboardData?.recentTransactions?.incomes?.map(inc => (
                  <div key={inc._id} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{inc.source}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(inc.date).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-emerald-500">+₹{inc.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Expenses */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="premium-card p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b dark:border-dark-border pb-2">Recent Expenses</h3>
            <div className="space-y-4">
              {dashboardData?.recentTransactions?.expenses?.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent expense records.</p>
              ) : (
                dashboardData?.recentTransactions?.expenses?.map(exp => (
                  <div key={exp._id} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{exp.category}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(exp.date).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-red-500">-₹{exp.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;