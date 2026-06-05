import React, { useState, useEffect } from 'react';
import { FiPlus, FiCreditCard, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import EmiFormModal from '../components/emi/EmiFormModal';

const EmiTracker = () => {
  const [emis, setEmis] = useState([]);
  const [metrics, setMetrics] = useState({ totalActive: 0, monthlyBurden: 0, totalOutstanding: 0, overdueCount: 0 });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchEmis = async () => {
    try {
      const { data } = await api.get('/emi');
      setEmis(data.data);
      setMetrics(data.metrics);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchEmis(); }, []);

  const handleCreateEmi = async (formData) => {
    try {
      await api.post('/emi', formData);
      setIsFormOpen(false);
      fetchEmis();
    } catch (error) { alert("Failed to add EMI"); }
  };

  const handleMarkPaid = async (id, amount) => {
    try {
      await api.post(`/emi/${id}/pay`, { amountPaid: amount });
      fetchEmis();
    } catch (error) { alert("Payment failed"); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this EMI record completely?")) {
      await api.delete(`/emi/${id}`);
      fetchEmis();
    }
  };

  return (
    <div className="pb-10 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EMI & Loan Tracker</h1>
          <p className="text-sm text-gray-500">Manage all your installments efficiently.</p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-5 rounded-xl font-bold shadow-lg">
          <FiPlus /> <span>Add EMI</span>
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="premium-card p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase font-bold">Monthly Burden</p>
          <h3 className="text-xl font-black text-blue-600 mt-1">₹{metrics.monthlyBurden.toLocaleString()}</h3>
        </div>
        <div className="premium-card p-4 border-l-4 border-amber-500">
          <p className="text-xs text-gray-500 uppercase font-bold">Total Outstanding</p>
          <h3 className="text-xl font-black text-amber-600 mt-1">₹{metrics.totalOutstanding.toLocaleString()}</h3>
        </div>
        <div className="premium-card p-4 border-l-4 border-emerald-500">
          <p className="text-xs text-gray-500 uppercase font-bold">Active Loans</p>
          <h3 className="text-xl font-black text-emerald-600 mt-1">{metrics.totalActive}</h3>
        </div>
        <div className="premium-card p-4 border-l-4 border-red-500">
          <p className="text-xs text-gray-500 uppercase font-bold">Overdue Payments</p>
          <h3 className="text-xl font-black text-red-600 mt-1">{metrics.overdueCount}</h3>
        </div>
      </div>

      {/* EMI LIST & PROGRESS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {emis.map(emi => {
          const progress = Math.min((emi.paidInstallments / emi.tenureMonths) * 100, 100).toFixed(1);
          const isOverdue = new Date(emi.nextDueDate) < new Date();
          
          return (
            <div key={emi._id} className="premium-card p-6 relative">
              {emi.status === 'Closed' && <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 rounded-bl-xl text-xs font-bold">CLOSED</div>}
              {isOverdue && emi.status !== 'Closed' && <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 rounded-bl-xl text-xs font-bold animate-pulse">OVERDUE</div>}
              
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg dark:text-white">{emi.emiName}</h3>
                  <p className="text-xs text-gray-500">{emi.lenderName} • {emi.category}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-gray-900 dark:text-white">₹{emi.emiAmount.toLocaleString()}</span><span className="text-xs text-gray-500">/mo</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 mb-4">
                <div className="flex justify-between text-xs mb-1 font-medium dark:text-gray-300">
                  <span>Paid: {emi.paidInstallments}/{emi.tenureMonths} Months</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[#334155] rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-[#334155]">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Next Due: <span className={isOverdue ? 'text-red-500 font-bold' : ''}>{new Date(emi.nextDueDate).toLocaleDateString()}</span>
                </div>
                <div className="space-x-2">
                  {emi.status !== 'Closed' && (
                    <button onClick={() => handleMarkPaid(emi._id, emi.emiAmount)} className="px-4 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-sm font-bold transition-colors">Pay ₹{emi.emiAmount}</button>
                  )}
                  <button onClick={() => handleDelete(emi._id)} className="px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-bold">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <EmiFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleCreateEmi} />
    </div>
  );
};
export default EmiTracker;