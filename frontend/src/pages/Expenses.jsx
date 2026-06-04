import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiFileText } from 'react-icons/fi';
import api from '../services/api';

import TransactionFormModal from '../components/transactions/TransactionFormModal';
import ReceiptModal from '../components/transactions/ReceiptModal';

const Expenses = () => {
  const { user } = useSelector(state => state.auth);
  
  const [activeTab, setActiveTab] = useState('expense'); // 'expense' or 'income'
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'expense' ? '/expenses' : '/income';
      const response = await api.get(`${endpoint}?search=${search}`);
      setTransactions(response.data.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line
  }, [activeTab, search]);

  const handleSaveTransaction = async (formData, id) => {
    const endpoint = activeTab === 'expense' ? '/expenses' : '/income';
    try {
      if (id) {
        await api.put(`${endpoint}/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsFormOpen(false);
      fetchTransactions();
    } catch (error) {
      console.error("Failed to save", error);
      alert(error.response?.data?.message || 'Error saving transaction');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const endpoint = activeTab === 'expense' ? '/expenses' : '/income';
      try {
        await api.delete(`${endpoint}/${id}`);
        fetchTransactions();
      } catch (error) {
        console.error("Failed to delete", error);
      }
    }
  };

  const openEdit = (txn) => {
    setSelectedTransaction(txn);
    setIsFormOpen(true);
  };

  const openAdd = () => {
    setSelectedTransaction(null);
    setIsFormOpen(true);
  };

  const openReceipt = (txn) => {
    setSelectedTransaction(txn);
    setIsReceiptOpen(true);
  };

  return (
    <div className="pb-10 h-full flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your cash flow efficiently.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search notes or source..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <button onClick={openAdd} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white py-2 px-5 rounded-xl shadow-sm transition-all font-medium whitespace-nowrap">
            <FiPlus className="h-5 w-5" />
            <span>Add {activeTab === 'expense' ? 'Expense' : 'Income'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 bg-gray-200/50 dark:bg-dark-border/50 p-1 rounded-xl w-max">
        <button 
          onClick={() => setActiveTab('expense')}
          className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'expense' ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Expenses
        </button>
        <button 
          onClick={() => setActiveTab('income')}
          className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'income' ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Income
        </button>
      </div>

      {/* Transactions List */}
      <div className="premium-card flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-dark-bg/50 border-b border-gray-100 dark:border-dark-border">
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Date</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">Category</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm">{activeTab === 'income' ? 'Source' : 'Method'}</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm text-right">Amount</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">No records found.</td></tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn._id} className="border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors group">
                    <td className="p-4 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {new Date(txn.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        {txn.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                      {activeTab === 'income' ? txn.source : txn.paymentMethod}
                    </td>
                    <td className={`p-4 text-sm font-bold text-right whitespace-nowrap ${activeTab === 'income' ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                      {activeTab === 'income' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openReceipt(txn)} className="text-blue-500 hover:text-blue-700 tooltip" title="View Receipt"><FiFileText className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(txn)} className="text-emerald-500 hover:text-emerald-700 tooltip" title="Edit"><FiEdit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(txn._id)} className="text-red-500 hover:text-red-700 tooltip" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <TransactionFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        type={activeTab} 
        editData={selectedTransaction} 
        onSave={handleSaveTransaction} 
      />

      <ReceiptModal 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
        transaction={selectedTransaction} 
        type={activeTab}
        user={user}
      />
      
    </div>
  );
};

export default Expenses;