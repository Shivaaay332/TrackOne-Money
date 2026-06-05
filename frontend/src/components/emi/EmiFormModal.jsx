import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiInfo } from 'react-icons/fi';

const EMI_CATEGORIES = ['Home Loan', 'Car Loan', 'Bike Loan', 'Mobile EMI', 'Personal Loan', 'Education Loan', 'Business Loan', 'Credit Card EMI', 'Appliance EMI', 'Other'];

const EmiFormModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    emiName: '', category: 'Personal Loan', lenderName: '', principalAmount: '', interestRate: '', tenureMonths: '', emiAmount: '', startDate: new Date().toISOString().split('T')[0]
  });
  
  const [autoCalculated, setAutoCalculated] = useState({ emi: 0, totalInterest: 0, totalPayable: 0 });

  // Auto EMI Calculator Logic
  useEffect(() => {
    const P = parseFloat(formData.principalAmount);
    const R = parseFloat(formData.interestRate) / 12 / 100; // Monthly interest rate
    const N = parseFloat(formData.tenureMonths);

    if (P > 0 && R > 0 && N > 0) {
      const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
      const totalPayable = emi * N;
      const totalInterest = totalPayable - P;
      setAutoCalculated({ emi: Math.round(emi), totalInterest: Math.round(totalInterest), totalPayable: Math.round(totalPayable) });
      setFormData(prev => ({ ...prev, emiAmount: Math.round(emi) })); // Auto-fill
    } else if (P > 0 && N > 0 && (R === 0 || !formData.interestRate)) {
      // 0% EMI scheme (like credit card no-cost EMI)
      const emi = P / N;
      setAutoCalculated({ emi: Math.round(emi), totalInterest: 0, totalPayable: P });
      setFormData(prev => ({ ...prev, emiAmount: Math.round(emi) }));
    }
  }, [formData.principalAmount, formData.interestRate, formData.tenureMonths]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Calculate End Date and First Due Date based on Start Date and Tenure
    const start = new Date(formData.startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + parseInt(formData.tenureMonths));
    const nextDue = new Date(start);
    nextDue.setMonth(nextDue.getMonth() + 1);

    const submissionData = { ...formData, endDate: end, nextDueDate: nextDue };
    await onSave(submissionData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-[#334155]">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-[#334155]">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add New EMI / Loan</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500"><FiX className="w-6 h-6" /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Loan/EMI Name</label><input type="text" name="emiName" required value={formData.emiName} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border dark:bg-[#0f172a] dark:text-white dark:border-[#334155] outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. iPhone 15 EMI" /></div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border dark:bg-[#0f172a] dark:text-white dark:border-[#334155] outline-none">
                  {EMI_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Lender/Bank Name</label><input type="text" name="lenderName" required value={formData.lenderName} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border dark:bg-[#0f172a] dark:text-white dark:border-[#334155] outline-none" placeholder="HDFC, Bajaj Finance..." /></div>
              <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Start Date</label><input type="date" name="startDate" required value={formData.startDate} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border dark:bg-[#0f172a] dark:text-white dark:border-[#334155] outline-none" /></div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <div><label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">Principal Amount (₹)</label><input type="number" name="principalAmount" required value={formData.principalAmount} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border dark:bg-[#0f172a] dark:text-white outline-none" placeholder="100000" /></div>
              <div><label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">Interest Rate (%)</label><input type="number" step="0.1" name="interestRate" value={formData.interestRate} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border dark:bg-[#0f172a] dark:text-white outline-none" placeholder="10.5" /></div>
              <div><label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">Tenure (Months)</label><input type="number" name="tenureMonths" required value={formData.tenureMonths} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border dark:bg-[#0f172a] dark:text-white outline-none" placeholder="12" /></div>
            </div>

            {/* AI Auto Calculation Insights */}
            {autoCalculated.emi > 0 && (
              <div className="flex items-start space-x-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200">
                <FiInfo className="mt-0.5" />
                <div className="text-sm font-medium">
                  <p><strong>Auto Calculated EMI:</strong> ₹{autoCalculated.emi.toLocaleString()} / month</p>
                  <p><strong>Total Interest Payable:</strong> ₹{autoCalculated.totalInterest.toLocaleString()}</p>
                </div>
              </div>
            )}

            <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Final Monthly EMI (₹)</label><input type="number" name="emiAmount" required value={formData.emiAmount} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border dark:bg-[#0f172a] dark:text-white outline-none font-bold text-lg" /></div>

            <div className="pt-4 flex space-x-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-[#334155] rounded-xl font-bold">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Add EMI</button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default EmiFormModal;