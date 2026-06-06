import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { FiPieChart, FiTrendingUp } from 'react-icons/fi';

// Mast Colors for Pie Chart
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const AnalyticsCharts = ({ monthlyTrend, expenseByCategory }) => {
  
  // Safe checks (Agar data nahi aaya toh khali array use karo)
  const safeTrendData = monthlyTrend && monthlyTrend.length > 0 ? monthlyTrend : [];
  const safePieData = expenseByCategory && expenseByCategory.length > 0 ? expenseByCategory : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Cash Flow Line Chart (Takes 2 columns space) */}
      <div className="lg:col-span-2 premium-card p-4 sm:p-6 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <FiTrendingUp className="mr-2 text-blue-500" /> Cash Flow Trend (Last 6 Months)
        </h3>
        
        {safeTrendData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-400 font-medium">
            No data available for the last 6 months. Add some transactions!
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safeTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, undefined]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                
                <Line type="monotone" name="Income" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Expense" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 2. Expense Category Pie Chart (Takes 1 column space) */}
      <div className="premium-card p-4 sm:p-6 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] rounded-2xl shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center">
          <FiPieChart className="mr-2 text-indigo-500" /> Expense Breakdown
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Where your money goes</p>

        {safePieData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mt-10">
            <div className="w-32 h-32 rounded-full border-4 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4">
              <span className="text-xs font-bold text-gray-400">Empty</span>
            </div>
            <p className="text-sm font-medium text-center px-4">Add expenses to see breakdown</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center relative min-h-[250px]">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={safePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {safePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, undefined]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend for Pie Chart */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {safePieData.map((entry, index) => (
                <div key={index} className="flex items-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AnalyticsCharts;