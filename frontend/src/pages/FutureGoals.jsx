import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiTarget, FiTrendingUp, FiAward } from 'react-icons/fi';
import api from '../services/api';
import GoalFormModal from '../components/goals/GoalFormModal';
import FundModal from '../components/goals/FundModal';

const FutureGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({ totalTarget: 0, totalSaved: 0, completedCount: 0 });

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFundOpen, setIsFundOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/goals');
      const data = response.data.data;
      setGoals(data);

      // Calculate Metrics
      let target = 0;
      let saved = 0;
      let completed = 0;
      data.forEach(g => {
        target += g.targetAmount;
        saved += g.currentAmount;
        if (g.isCompleted) completed += 1;
      });
      setMetrics({ totalTarget: target, totalSaved: saved, completedCount: completed });

    } catch (error) {
      console.error("Failed to fetch goals", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (formData) => {
    try {
      await api.post('/goals', formData);
      setIsFormOpen(false);
      fetchGoals();
    } catch (error) {
      console.error("Error creating goal", error);
      alert(error.response?.data?.message || 'Error creating goal');
    }
  };

  const handleManageFunds = async (goalId, amount, actionType) => {
    try {
      await api.patch(`/goals/${goalId}/fund`, { amount, actionType });
      setIsFundOpen(false);
      fetchGoals();
    } catch (error) {
      console.error("Error managing funds", error);
      alert(error.response?.data?.message || 'Error processing transaction. Check if funds are sufficient for withdrawal.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to drop this goal?")) {
      try {
        await api.delete(`/goals/${id}`);
        fetchGoals();
      } catch (error) {
        console.error("Failed to delete", error);
      }
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === 'High') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (priority === 'Medium') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  return (
    <div className="pb-10 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Future Goals</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visualize and fund your financial dreams.</p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-2 px-5 rounded-xl shadow-sm transition-all font-medium">
          <FiPlus className="h-5 w-5" />
          <span>Create New Goal</span>
        </button>
      </div>

      {/* Overview Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="premium-card p-5 flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl"><FiTarget className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Target Amount</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₹{metrics.totalTarget.toLocaleString()}</h3>
          </div>
        </div>
        <div className="premium-card p-5 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl"><FiTrendingUp className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Funds Saved</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₹{metrics.totalSaved.toLocaleString()}</h3>
          </div>
        </div>
        <div className="premium-card p-5 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-xl"><FiAward className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Goals Completed</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.completedCount} / {goals.length}</h3>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 p-8">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400 premium-card">
            No active goals. Time to start dreaming big!
          </div>
        ) : (
          goals.map(goal => {
            const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100).toFixed(1);
            const isFinished = goal.isCompleted;

            return (
              <div key={goal._id} className="premium-card p-6 flex flex-col relative overflow-hidden group">
                {isFinished && (
                  <div className="absolute top-0 right-0 px-4 py-1 text-xs font-bold bg-emerald-500 text-white rounded-bl-xl shadow-sm z-10">
                    ACHIEVED 🎉
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{goal.goalName}</h3>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${getPriorityColor(goal.priorityLevel)}`}>
                      {goal.priorityLevel} Priority
                    </span>
                  </div>
                  <button onClick={() => handleDelete(goal._id)} className="text-gray-400 hover:text-red-500 transition-colors tooltip" title="Delete Goal">
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-bold text-gray-900 dark:text-white">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-1000 ${getProgressColor(percentage)}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Saved</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white">₹{goal.currentAmount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Target</p>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300">₹{goal.targetAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-dark-border flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Target: {new Date(goal.targetMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                  <button 
                    onClick={() => { setSelectedGoal(goal); setIsFundOpen(true); }}
                    className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    Manage Funds
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <GoalFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleCreateGoal} />
      <FundModal isOpen={isFundOpen} onClose={() => setIsFundOpen(false)} goal={selectedGoal} onSave={handleManageFunds} />
      
    </div>
  );
};

export default FutureGoals;