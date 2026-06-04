import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiFileText } from 'react-icons/fi';
import api from '../services/api';

import TransactionFormModal from '../components/transactions/TransactionFormModal';
import ReceiptModal from '../components/transactions/ReceiptModal';

const Expenses = () => {
  const { user } = useSelector(state => state.auth);
  
  const [activeTab, setActiveTab] = useState('expense'); 
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'expense' ? '/expenses' : '/income';
      const response = await api.get(`${endpoint}?search=${search}`);
      setTransactions(response.data.data);
    } catch (error) { console.error("Failed to fetch data", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTransactions(); }, [activeTab, search]);

  const handleSaveTransaction = async (formData, id) => {
    const endpoint = activeTab === 'expense' ? '/expenses' : '/income';
    try {
      if (id) { await api.put(`${endpoint}/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); } 
      else { await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); }
      setIsFormOpen(false); fetchTransactions();
    } catch (error) { alert(error.response?.data?.message || 'Error saving transaction'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const endpoint = activeTab === 'expense' ? '/expenses' : '/income';
      try { await api.delete(`${endpoint}/${id}`); fetchTransactions(); } 
      catch (error) { console.error("Failed to delete", error); }
    }
  };

  const openEdit = (txn) => { setSelectedTransaction(txn); setIsFormOpen(true); };
  const openAdd = () => { setSelectedTransaction(null); setIsFormOpen(true); };
  const openReceipt = (txn) => { setSelectedTransaction(txn); setIsReceiptOpen(true); };

  return (
    <div className="pb-10 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your cash flow efficiently.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search notes or source..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" />
          </div>
          <button onClick={openAdd} className={`w-full sm:w-auto flex items-center justify-center space-x-2 text-white py-2.5 px-6 rounded-xl shadow-lg transition-all font-bold whitespace-nowrap ${activeTab === 'income' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30' : 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/30'}`}>
            <FiPlus className="h-5 w-5" />
            <span>Add {activeTab === 'expense' ? 'Expense' : 'Income'}</span>
          </button>
        </div>
      </div>

      <div className="flex space-x-2 mb-6 bg-gray-200/50 dark:bg-[#1e293b]/50 p-1 rounded-xl w-max">
        <button onClick={() => setActiveTab('expense')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'expense' ? 'bg-white dark:bg-[#0f172a] text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          Expenses
        </button>
        <button onClick={() => setActiveTab('income')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'income' ? 'bg-white dark:bg-[#0f172a] text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          Income
        </button>
      </div>

      <div className="premium-card flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-[#0f172a]/80 border-b border-gray-100 dark:border-[#334155]">
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Date</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Category</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">{activeTab === 'income' ? 'Source' : 'Method'}</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider text-right">Amount</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-bold">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400 font-bold">No records found.</td></tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn._id} className="border-b border-gray-50 dark:border-[#334155]/50 hover:bg-[#F4F7FE] dark:hover:bg-[#0f172a] transition-colors group">
                    <td className="p-4 text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {new Date(txn.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700 dark:bg-[#334155] dark:text-gray-300">
                        {txn.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                      {activeTab === 'income' ? txn.source : txn.paymentMethod}
                    </td>
                    
                    {/* RECOMMENDED PRICE COLOR CODING */}
                    <td className={`p-4 text-lg font-black tracking-tight text-right whitespace-nowrap ${activeTab === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {activeTab === 'income' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </td>
                    
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openReceipt(txn)} className="p-1.5 text-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 rounded-lg tooltip transition-colors"><FiFileText className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(txn)} className="p-1.5 text-amber-500 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 rounded-lg tooltip transition-colors"><FiEdit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(txn._id)} className="p-1.5 text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 rounded-lg tooltip transition-colors"><FiTrash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} type={activeTab} editData={selectedTransaction} onSave={handleSaveTransaction} />
      <ReceiptModal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} transaction={selectedTransaction} type={activeTab} user={user} />
    </div>
  );
};

export default Expenses;