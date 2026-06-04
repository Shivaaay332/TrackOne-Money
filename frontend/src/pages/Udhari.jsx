import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiCheckCircle, FiBell, FiAlertCircle, FiClock } from 'react-icons/fi';
import api from '../services/api';
import UdhariFormModal from '../components/udhari/UdhariFormModal';

const Udhari = () => {
  const [activeTab, setActiveTab] = useState('lene'); // 'lene' = Lene Wale, 'dene' = Dene Wale
  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState({ totalReceivable: 0, totalPayable: 0, pendingAmount: 0, settledAmount: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchUdhariData = async () => {
    setLoading(true);
    try {
      const dbType = activeTab === 'lene' ? 'Lene Wale' : 'Dene Wale';
      const response = await api.get(`/udhari?type=${dbType}&search=${search}`);
      setRecords(response.data.data);
      setMetrics(response.data.metrics);
    } catch (error) {
      console.error("Failed to fetch udhari records", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUdhariData();
    // eslint-disable-next-line
  }, [activeTab, search]);

  const handleSaveRecord = async (formData, id) => {
    try {
      if (id) {
        // Edit requires dropping it, backend update omitted for brevity, let's treat Udhari like a ledger (delete and re-add or we use standard put. Wait, backend didn't have Udhari PUT, only POST/DELETE/PATCH. Let's create new and delete old if editing, or just add.)
        // Self-Correction: I will assume deleting and recreating for an edit since PUT wasn't in Part 3 Udhari backend. 
        await api.delete(`/udhari/${id}`);
        await api.post('/udhari', formData);
      } else {
        await api.post('/udhari', formData);
      }
      setIsFormOpen(false);
      fetchUdhariData();
    } catch (error) {
      console.error("Failed to save", error);
      alert(error.response?.data?.message || 'Error saving record');
    }
  };

  const handleToggleSettlement = async (id) => {
    try {
      await api.patch(`/udhari/${id}/settle`);
      fetchUdhariData();
    } catch (error) {
      console.error("Failed to settle", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this Udhari record completely?")) {
      try {
        await api.delete(`/udhari/${id}`);
        fetchUdhariData();
      } catch (error) {
        console.error("Failed to delete", error);
      }
    }
  };

  const handleReminder = (phone) => {
    // Opens default SMS app with pre-filled message
    window.open(`sms:${phone}?body=Hi, this is a gentle reminder regarding the pending Udhari amount on TrackOne Money. Please clear it at your earliest convenience.`);
  };

  const openAdd = () => {
    setSelectedRecord(null);
    setIsFormOpen(true);
  };

  const checkOverdue = (dueDate, isSettled) => {
    if (isSettled) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="pb-10 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Udhari Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track who owes you and who you owe.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search name or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <button onClick={openAdd} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white py-2 px-5 rounded-xl shadow-sm transition-all font-medium whitespace-nowrap">
            <FiPlus className="h-5 w-5" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="premium-card p-4 border-l-4 border-emerald-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Total Receivable (Get)</p>
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{metrics.totalReceivable.toLocaleString()}</h3>
        </div>
        <div className="premium-card p-4 border-l-4 border-red-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Total Payable (Give)</p>
          <h3 className="text-xl font-black text-red-600 dark:text-red-400 mt-1">₹{metrics.totalPayable.toLocaleString()}</h3>
        </div>
        <div className="premium-card p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Total Settled</p>
          <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">₹{metrics.settledAmount.toLocaleString()}</h3>
        </div>
        <div className="premium-card p-4 border-l-4 border-amber-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Total Pending</p>
          <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">₹{metrics.pendingAmount.toLocaleString()}</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 bg-gray-200/50 dark:bg-dark-border/50 p-1 rounded-xl w-max">
        <button 
          onClick={() => setActiveTab('lene')}
          className={`px-6 py-2 rounded-lg font-medium text-sm transition-all flex items-center space-x-2 ${activeTab === 'lene' ? 'bg-white dark:bg-dark-card text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <span>Lene Wale (Get)</span>
        </button>
        <button 
          onClick={() => setActiveTab('dene')}
          className={`px-6 py-2 rounded-lg font-medium text-sm transition-all flex items-center space-x-2 ${activeTab === 'dene' ? 'bg-white dark:bg-dark-card text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <span>Dene Wale (Give)</span>
        </button>
      </div>

      {/* Records List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-500">Loading ledgers...</div>
        ) : records.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400 premium-card">No records found. Clean slate!</div>
        ) : (
          records.map((record) => {
            const isOverdue = checkOverdue(record.dueDate, record.isSettled);
            
            return (
              <div key={record._id} className={`premium-card p-5 relative overflow-hidden ${isOverdue ? 'border-red-300 dark:border-red-800' : ''}`}>
                {/* Status Badge */}
                <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl text-white shadow-sm" style={{
                  backgroundColor: record.isSettled ? '#10b981' : (isOverdue ? '#ef4444' : '#f59e0b')
                }}>
                  {record.isSettled ? 'SETTLED' : (isOverdue ? 'OVERDUE' : 'PENDING')}
                </div>

                <div className="flex justify-between items-start mb-4 mt-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{record.personName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{record.phoneNumber}</p>
                  </div>
                  <div className="text-right mt-1">
                    <span className={`text-xl font-black ${activeTab === 'lene' ? 'text-emerald-500' : 'text-red-500'}`}>
                      ₹{record.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <FiClock className="mr-2 text-gray-400" />
                    <span>Given on: <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span></span>
                  </div>
                  <div className={`flex items-center text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-600 dark:text-gray-300'}`}>
                    {isOverdue ? <FiAlertCircle className="mr-2" /> : <FiClock className="mr-2 text-gray-400" />}
                    <span>Due Date: <span className="font-medium">{new Date(record.dueDate).toLocaleDateString()}</span></span>
                  </div>
                  {record.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2 mt-2 border-t border-gray-100 dark:border-dark-border pt-2">
                      "{record.description}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-dark-border">
                  <button 
                    onClick={() => handleToggleSettlement(record._id)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${record.isSettled ? 'bg-gray-100 text-gray-600 dark:bg-dark-border dark:text-gray-400' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'}`}
                  >
                    <FiCheckCircle />
                    <span>{record.isSettled ? 'Mark Pending' : 'Mark Settled'}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {!record.isSettled && (
                      <button onClick={() => handleReminder(record.phoneNumber)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg tooltip" title="Send SMS Reminder">
                        <FiBell />
                      </button>
                    )}
                    <button onClick={() => { setSelectedRecord(record); setIsFormOpen(true); }} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg tooltip" title="Edit">
                      <FiEdit2 />
                    </button>
                    <button onClick={() => handleDelete(record._id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg tooltip" title="Delete">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <UdhariFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        type={activeTab} 
        editData={selectedRecord} 
        onSave={handleSaveRecord} 
      />
    </div>
  );
};

export default Udhari;