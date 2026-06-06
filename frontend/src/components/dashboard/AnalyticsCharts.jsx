import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LabelList
} from 'recharts';
import { FiPieChart, FiTrendingUp, FiTarget, FiCreditCard, FiUsers } from 'react-icons/fi';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const AnalyticsCharts = ({ dashboardData, reportMode }) => {
  const data = dashboardData || {};
  const charts = data.charts || {};
  const extra = data.extraMetrics || {};
  const isDetailed = reportMode === 'detailed';

  // HELPER: To format large numbers beautifully (e.g. 1500 -> 1.5k) on graph labels
  const formatCompactNum = (num) => {
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
    return `₹${num}`;
  };

  // 1. Line Chart Data
  const safeTrendData = (charts.monthlyTrend || []).map(item => ({
    name: item.name || item.month || item.monthStr || 'N/A',
    income: Number(item.income) || 0,
    expense: Number(item.expense) || 0
  }));

  // 2. Expense Pie Chart Data
  const safePieData = (charts.expenseByCategory || [])
    .map(item => ({
      name: item.name || item.category || item._id || 'Other',
      value: Number(item.value) || Number(item.amount) || Number(item.total) || 0
    })).filter(item => item.value > 0);

  // 3. Udhari Pie Chart Data
  const udhariMetrics = data.cards?.udhariMetrics || {};
  const udhariPieData = [
    { name: 'To Receive', value: Number(udhariMetrics.totalReceivable) || 0 },
    { name: 'To Give', value: Number(udhariMetrics.totalPayable) || 0 }
  ].filter(i => i.value > 0);

  // 4. Goals Bar Chart Data
  const goalsData = (extra.goals || []).map(g => ({
    name: (g.goalName || g.name || g.title || 'Goal').substring(0, 15),
    target: Number(g.targetAmount || g.target || g.goalAmount) || 0,
    saved: Number(g.savedAmount || g.saved || g.currentAmount) || 0
  }));

  // 5. EMI Bar Chart Data
  const emiData = (extra.emis || [])
    .filter(e => e.status !== 'Closed')
    .map(e => {
      const amt = Number(e.emiAmount || e.amount) || 0;
      const totalMonths = Number(e.tenureMonths) || 1;
      const paidMonths = Number(e.paidInstallments) || 0;
      return {
        name: (e.emiName || e.name || 'EMI').substring(0, 15),
        pending: amt * Math.max(0, totalMonths - paidMonths)
      };
    }).filter(e => e.pending > 0);

  // Custom Label for Pie Charts (Direct Percentage)
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't crowd small slices
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const customTooltip = (value) => [`₹${Number(value).toLocaleString('en-IN')}`, undefined];

  return (
    <>
      {/* 🔥 GLOBAL CSS BUG FIX: Yeh ugly focus borders aur highlight hata dega 🔥 */}
      <style>{`
        .recharts-wrapper * { outline: none !important; -webkit-tap-highlight-color: transparent !important; }
        .recharts-surface { outline: none !important; }
        .recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line { stroke: #334155; stroke-opacity: 0.15; }
      `}</style>

      {/* SVG GRADIENTS DEFS FOR PREMIUM LOOK */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
        </defs>
      </svg>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* 1. Cash Flow Trend (Always Visible, Area Chart for beauty) */}
        <div className="lg:col-span-2 premium-card p-4 sm:p-6 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] rounded-3xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <FiTrendingUp className="mr-2 text-blue-500" /> Cash Flow Trend (Last 6 Months)
          </h3>
          {safeTrendData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400 font-medium">No data available</div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safeTrendData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10}/>
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}/>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} formatter={customTooltip} cursor={{ stroke: '#334155', strokeWidth: 2, strokeDasharray: '4 4' }}/>
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  
                  {/* DIRECT DATA LABELS ON TOP OF GRAPH */}
                  <Area type="monotone" name="Income" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 6, stroke: 'none' }}>
                    <LabelList dataKey="income" position="top" fill="#10b981" fontSize={10} fontWeight="bold" formatter={(val) => val > 0 ? formatCompactNum(val) : ''} />
                  </Area>
                  <Area type="monotone" name="Expense" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" activeDot={{ r: 6, stroke: 'none' }}>
                    <LabelList dataKey="expense" position="top" fill="#ef4444" fontSize={10} fontWeight="bold" formatter={(val) => val > 0 ? formatCompactNum(val) : ''} />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 2. Expense Category Pie Chart (Always Visible) */}
        <div className="premium-card p-4 sm:p-6 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] rounded-3xl shadow-lg flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <FiPieChart className="mr-2 text-rose-500" /> Expense Breakdown
          </h3>
          {safePieData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mt-10">No expenses recorded</div>
          ) : (
            <div className="flex-1 flex flex-col justify-center relative min-h-[250px]">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={safePieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name" stroke="none" labelLine={false} label={renderPieLabel}>
                    {safePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} formatter={customTooltip}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {safePieData.map((entry, index) => (
                  <div key={index} className="flex items-center text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#0f172a] px-2 py-1 rounded-md">
                    <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>{entry.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 👇 DETAILED LAYOUT CHARTS (Only visible if Detailed Layout is selected) 👇 */}
        {isDetailed && (
          <>
            {/* 3. Udhari Market Pie Chart */}
            <div className="premium-card p-4 sm:p-6 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] rounded-3xl shadow-lg flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                <FiUsers className="mr-2 text-amber-500" /> Udhari Distribution
              </h3>
              {udhariPieData.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mt-10">No active Udhari</div>
              ) : (
                <div className="flex-1 flex flex-col justify-center relative min-h-[250px]">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={udhariPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name" stroke="none" labelLine={false} label={renderPieLabel}>
                        <Cell fill="#10b981" /> {/* Lene Wale - Green */}
                        <Cell fill="#ef4444" /> {/* Dene Wale - Red */}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} formatter={customTooltip}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    <div className="flex items-center text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-md">
                      <span className="w-2.5 h-2.5 rounded-full mr-1.5 bg-emerald-500"></span>To Receive (Lene)
                    </div>
                    <div className="flex items-center text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-md">
                      <span className="w-2.5 h-2.5 rounded-full mr-1.5 bg-rose-500"></span>To Give (Dene)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Goals Bar Chart (Takes full width) */}
            <div className="lg:col-span-2 premium-card p-4 sm:p-6 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] rounded-3xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <FiTarget className="mr-2 text-purple-500" /> Goals Progress
              </h3>
              {goalsData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-gray-400 font-medium">No active goals</div>
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={goalsData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10}/>
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}/>
                      <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} formatter={customTooltip}/>
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      
                      <Bar dataKey="saved" name="Saved Amount" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50}>
                        <LabelList dataKey="saved" position="top" fill="#10b981" fontSize={10} fontWeight="bold" formatter={(val) => val > 0 ? formatCompactNum(val) : ''} />
                      </Bar>
                      <Bar dataKey="target" name="Target Amount" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50}>
                        <LabelList dataKey="target" position="top" fill="#3b82f6" fontSize={10} fontWeight="bold" formatter={(val) => val > 0 ? formatCompactNum(val) : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 5. EMI Pending Bar Chart (Takes full width) */}
            <div className="lg:col-span-2 premium-card p-4 sm:p-6 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] rounded-3xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <FiCreditCard className="mr-2 text-indigo-500" /> EMI Outstanding (Pending Amount)
              </h3>
              {emiData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-gray-400 font-medium">No pending EMIs</div>
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emiData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10}/>
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}/>
                      <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} formatter={customTooltip}/>
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar dataKey="pending" name="Total Pending Amount" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={60}>
                         <LabelList dataKey="pending" position="top" fill="#ef4444" fontSize={11} fontWeight="bold" formatter={(val) => val > 0 ? formatCompactNum(val) : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AnalyticsCharts;