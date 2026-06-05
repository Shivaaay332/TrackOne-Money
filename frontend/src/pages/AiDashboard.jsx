import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiTrendingUp, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';

const AiDashboard = () => {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAiData = async () => {
      try {
        const { data } = await api.get('/ai/dashboard');
        setAiData(data.data);
      } catch (error) { console.error("Error fetching AI data"); }
      finally { setLoading(false); }
    };
    fetchAiData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><FiActivity className="animate-spin h-10 w-10 text-indigo-500" /></div>;

  const score = aiData?.score || 0;
  let scoreColor = 'text-red-500';
  let scoreText = 'Needs Improvement';
  if (score >= 90) { scoreColor = 'text-emerald-500'; scoreText = 'Excellent'; }
  else if (score >= 75) { scoreColor = 'text-blue-500'; scoreText = 'Good'; }
  else if (score >= 60) { scoreColor = 'text-amber-500'; scoreText = 'Average'; }

  return (
    <div className="pb-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">TrackOne AI Intelligence</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Your automated financial health advisor.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Health Score Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Financial Health Score</h3>
          <div className="relative">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-[#334155]" />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="440" strokeDashoffset={440 - (440 * score) / 100} className={`${scoreColor} transition-all duration-1000 ease-out`} />
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <span className={`text-5xl font-black ${scoreColor}`}>{score}</span>
            </div>
          </div>
          <p className={`mt-4 font-bold text-lg ${scoreColor}`}>{scoreText}</p>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 premium-card p-6 border-t-4 border-indigo-500">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center"><FiActivity className="mr-2 text-indigo-500" /> AI Action Plan</h3>
          
          <div className="space-y-4">
            {aiData?.recommendations.length > 0 ? aiData.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                <FiAlertTriangle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm font-medium text-red-800 dark:text-red-300">{rec}</p>
              </div>
            )) : (
              <div className="flex items-start p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                <FiCheckCircle className="text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Your finances are in perfect shape. Keep up the good work!</p>
              </div>
            )}

            {aiData?.insights.map((insight, i) => (
              <div key={i} className="flex items-start p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl">
                <FiTrendingUp className="text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">{insight}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AiDashboard;