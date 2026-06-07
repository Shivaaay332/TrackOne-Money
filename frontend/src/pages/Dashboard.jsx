import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiLoader, FiFileText } from 'react-icons/fi';
import api from '../services/api';
import { generateProfessionalReport } from '../utils/pdfGenerator';
import { getDateFilters } from '../utils/dateFilters';

import StatCards from '../components/dashboard/StatCards';
import AnalyticsCharts from '../components/dashboard/AnalyticsCharts';

const PERIOD_OPTIONS = ['All Time', 'This Month', 'This Year'];

const fetchHistories = async (moduleType, records) => {
  if (!records?.length) return [];
  const responses = await Promise.all(
    records.map((r) => api.get(`/history/${moduleType}/${r._id}`).catch(() => ({ data: { data: [] } })))
  );
  return records.map((record, i) => ({
    record,
    history: responses[i].data.data || [],
  }));
};

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('This Month');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { query } = getDateFilters(reportPeriod);

      const [summaryRes, goalsRes, emiRes, udhariRes] = await Promise.all([
        api.get(`/dashboard/summary${query}`),
        api.get('/goals').catch(() => ({ data: { data: [] } })),
        api.get('/emi').catch(() => ({ data: { data: [] } })),
        api.get('/udhari').catch(() => ({ data: { data: [] } })),
      ]);

      const summaryData = summaryRes.data.data;
      const goals = goalsRes.data.data || [];
      const emis = emiRes.data.data || [];
      const udharis = udhariRes.data.data || [];

      const [emiWithHistory, udhariWithHistory, goalsWithHistory] = await Promise.all([
        fetchHistories('EMI', emis),
        fetchHistories('Udhari', udharis),
        fetchHistories('Goal', goals),
      ]);

      let totalGoalTarget = 0;
      let totalGoalSaved = 0;
      goals.forEach((g) => {
        totalGoalTarget += Number(g.targetAmount || g.target) || 0;
        totalGoalSaved += Number(g.currentAmount || g.savedAmount) || 0;
      });

      let totalEmiPending = 0;
      emis.forEach((e) => {
        if (e.status !== 'Closed') {
          const amt = Number(e.emiAmount || e.amount) || 0;
          const totalMonths = Number(e.tenureMonths) || 1;
          const paidMonths = Number(e.paidInstallments) || 0;
          totalEmiPending += amt * Math.max(0, totalMonths - paidMonths);
        }
      });

      setDashboardData({
        ...summaryData,
        extraMetrics: {
          goals,
          emis,
          udharis,
          totalGoalTarget,
          totalGoalSaved,
          totalEmiPending,
          emiWithHistory,
          udhariWithHistory,
          goalsWithHistory,
        },
      });
    } catch (error) {
      console.error('Failed to fetch dashboard summary', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportPeriod]);

  const handleExportPDF = async () => {
    if (!dashboardData) return;
    setIsExporting(true);
    try {
      const { listQuery, start: startFilter, end: endFilter } = getDateFilters(reportPeriod);

      const [expRes, incRes] = await Promise.all([
        api.get(`/expenses${listQuery}`).catch(() => ({ data: { data: [] } })),
        api.get(`/income${listQuery}`).catch(() => ({ data: { data: [] } })),
      ]);

      const emis = dashboardData.extraMetrics?.emis || [];
      const emiHistoryPromises = emis.map((emi) =>
        api.get(`/history/EMI/${emi._id}`).catch(() => ({ data: { data: [] } }))
      );
      const emiHistoryResponses = await Promise.all(emiHistoryPromises);

      let allEmiHistory = [];
      emiHistoryResponses.forEach((res, index) => {
        const logs = res.data.data || [];
        const emiName = emis[index].emiName || emis[index].name || 'EMI';
        logs.forEach((log) => {
          const logDate = new Date(log.date);
          let isValid = true;
          if (startFilter && endFilter) isValid = logDate >= startFilter && logDate <= endFilter;
          if (isValid) allEmiHistory.push({ ...log, emiName });
        });
      });

      const safeDataForPDF = {
        ...dashboardData,
        totalIncome: Number(dashboardData?.cards?.totalIncome) || 0,
        totalExpenses: Number(dashboardData?.cards?.totalExpenses) || 0,
        cards: {
          totalIncome: Number(dashboardData?.cards?.totalIncome) || 0,
          totalExpenses: Number(dashboardData?.cards?.totalExpenses) || 0,
          udhariMetrics: dashboardData?.cards?.udhariMetrics || {},
          emiMetrics: dashboardData?.cards?.emiMetrics || {},
        },
        charts: dashboardData?.charts || {},
        detailedLists: {
          expenses: expRes.data.data || [],
          incomes: incRes.data.data || [],
          udhari: dashboardData.extraMetrics?.udharis || [],
          goals: dashboardData.extraMetrics?.goals || [],
          emis,
          emiHistory: allEmiHistory,
        },
      };

      await generateProfessionalReport(safeDataForPDF, user || {}, reportPeriod, 'detailed');
    } catch (error) {
      console.error('PDF generation failed', error);
      alert('Failed to generate professional report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <FiLoader className="animate-spin h-10 w-10 text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="pb-8 max-w-[1400px] mx-auto">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Financial Overview</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {reportPeriod === 'All Time' && 'Poora data — payment history ke saath'}
          {reportPeriod === 'This Month' &&
            `${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })} ka data`}
          {reportPeriod === 'This Year' && `${new Date().getFullYear()} ka data`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setReportPeriod(opt)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                reportPeriod === opt
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 hover:border-emerald-400'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
        >
          {isExporting ? <FiLoader className="animate-spin h-4 w-4" /> : <FiFileText className="h-4 w-4" />}
          <span>{isExporting ? 'Generating...' : 'Export PDF'}</span>
        </button>
      </div>

      <div className="space-y-5 sm:space-y-6">
        <StatCards summaryData={dashboardData} reportPeriod={reportPeriod} />
        {dashboardData && (
          <AnalyticsCharts dashboardData={dashboardData} reportPeriod={reportPeriod} loading={loading} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
