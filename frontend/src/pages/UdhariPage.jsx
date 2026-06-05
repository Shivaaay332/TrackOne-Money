import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import api from '../services/api';
import UdhariFormModal from '../components/udhari/UdhariFormModal';
import HistoryLedgerModal from '../components/common/HistoryLedgerModal'; // <-- NAYA IMPORT

const Udhari = () => {
  const [activeTab, setActiveTab] = useState('lene'); 
  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState({ totalReceivable: 0, totalPayable: 0, pendingAmount: 0, settledAmount: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // <-- NAYA STATE HISTORY MODAL KE LIYE -->
  const [historyModalState, setHistoryModalState] = useState({ isOpen: false, moduleType: 'Udhari', recordId: '', title: '' });

  const fetchUdhariData = async () => {
    setLoading(true);
    try {
      const dbType = activeTab === 'lene' ? 'Lene Wale' : 'Dene Wale';
      const response = await api.get(`/udhari?type=${dbType}&search=${search}`);
      setRecords(response.data.data);
      setMetrics(response.data.metrics);
    } catch (error) { console.error("Failed to fetch udhari records", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUdhariData(); }, [activeTab, search]);

  const handleSaveRecord = async (formData, id) => {
    try {
      if (id) { await api.delete(`/udhari/${id}`); await api.post('/udhari', formData); } 
      else { await api.post('/udhari', formData); }
      setIsFormOpen(false); fetchUdhariData();
    } catch (error) { alert(error.response?.data?.message || 'Error saving record'); }
  };

  const handleToggleSettlement = async (id) => {
    try { await api.patch(`/udhari/${id}/settle`); fetchUdhariData(); } 
    catch (error) { console.error("Failed to settle", error); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this Udhari record completely?")) {
      try { await api.delete(`/udhari/${id}`); fetchUdhariData(); } 
      catch (error) { console.error("Failed to delete", error); }
    }
  };

  const handleWhatsappReminder = (record) => {
    const cleanPhone = record.phoneNumber.replace(/\D/g, ''); 
    let message = "";
    if (record.type === 'Lene Wale') {
      message = `Hi ${record.personName}, \n\nThis is a gentle reminder regarding the pending amount of *₹${record.amount}* on our TrackOne ledger. Please try to clear it at your earliest convenience. \n\nThank you! 🤝`;
    } else {
      message = `Hi ${record.personName}, \n\nI wanted to update you regarding the pending amount of *₹${record.amount}* that I owe you. I am keeping track of it and will settle it soon. \n\nThank you for your patience! 🙏`;
    }
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
  };

  const openAdd = () => { setSelectedRecord(null); setIsFormOpen(true); };
  const checkOverdue = (dueDate, isSettled) => { return !isSettled && new Date(dueDate) < new Date(); };

  return (
    <div className="pb-10 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Udhari Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track who owes you and who you owe.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
          </div>
          <button onClick={openAdd} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2 px-5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all font-bold whitespace-nowrap">
            <FiPlus className="h-5 w-5" /> <span>Add Record</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="premium-card p-4 border-b-4 border-emerald-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Total Receivable</p>
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{metrics.totalReceivable.toLocaleString()}</h3>
        </div>
        <div className="premium-card p-4 border-b-4 border-rose-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Total Payable</p>
          <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">₹{metrics.totalPayable.toLocaleString()}</h3>
        </div>
        <div className="premium-card p-4 border-b-4 border-blue-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Total Settled</p>
          <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">₹{metrics.settledAmount.toLocaleString()}</h3>
        </div>
        <div className="premium-card p-4 border-b-4 border-amber-500">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Total Pending</p>
          <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">₹{metrics.pendingAmount.toLocaleString()}</h3>
        </div>
      </div>

      <div className="flex space-x-2 mb-6 p-1 rounded-xl w-max bg-gray-200/50 dark:bg-[#1e293b]/50">
        <button onClick={() => setActiveTab('lene')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${activeTab === 'lene' ? 'bg-white dark:bg-[#0f172a] text-emerald-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 shadow-none'}`}>
          Lene Wale (Get)
        </button>
        <button onClick={() => setActiveTab('dene')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${activeTab === 'dene' ? 'bg-white dark:bg-[#0f172a] text-rose-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 shadow-none'}`}>
          Dene Wale (Give)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-500">Loading ledgers...</div>
        ) : records.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400 premium-card font-bold">No records found. Clean slate! ✨</div>
        ) : (
          records.map((record) => {
            const isOverdue = checkOverdue(record.dueDate, record.isSettled);
            return (
              <div key={record._id} className={`premium-card p-5 relative overflow-hidden ${isOverdue ? 'border-l-4 border-l-rose-500' : ''}`}>
                <div className="absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl text-white shadow-sm" style={{ backgroundColor: record.isSettled ? '#10b981' : (isOverdue ? '#e11d48' : '#f59e0b') }}>
                  {record.isSettled ? 'SETTLED' : (isOverdue ? 'OVERDUE' : 'PENDING')}
                </div>

                <div className="flex justify-between items-start mb-4 mt-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{record.personName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{record.phoneNumber}</p>
                  </div>
                  <div className="text-right mt-1">
                    <span className={`text-2xl font-black tracking-tight ${activeTab === 'lene' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      ₹{record.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300"><FiClock className="mr-2 text-gray-400" /><span>Given on: <span className="font-bold">{new Date(record.date).toLocaleDateString()}</span></span></div>
                  <div className={`flex items-center text-sm ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-gray-600 dark:text-gray-300'}`}>
                    {isOverdue ? <FiAlertCircle className="mr-2" /> : <FiClock className="mr-2 text-gray-400" />}
                    <span>Due Date: <span className="font-bold">{new Date(record.dueDate).toLocaleDateString()}</span></span>
                  </div>
                  {record.description && <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2 mt-2 bg-gray-50 dark:bg-[#0f172a] p-2 rounded-md">"{record.description}"</p>}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#334155]">
                  <button onClick={() => handleToggleSettlement(record._id)} className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${record.isSettled ? 'bg-gray-100 text-gray-600 dark:bg-[#334155] dark:text-gray-400' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                    <FiCheckCircle /> <span>{record.isSettled ? 'Mark Pending' : 'Mark Settled'}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {/* NAYA HISTORY BUTTON */}
                    <button onClick={() => setHistoryModalState({ isOpen: true, moduleType: 'Udhari', recordId: record._id, title: record.personName })} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-lg tooltip transition-colors" title="View Detailed History">
                      <FiClock />
                    </button>

                    {!record.isSettled && (
                      <button onClick={() => handleWhatsappReminder(record)} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 rounded-lg tooltip transition-colors" title="Send WhatsApp Reminder">
                        <FaWhatsapp className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => { setSelectedRecord(record); setIsFormOpen(true); }} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg tooltip transition-colors" title="Edit">
                      <FiEdit2 />
                    </button>
                    <button onClick={() => handleDelete(record._id)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 rounded-lg tooltip transition-colors" title="Delete">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <UdhariFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} type={activeTab} editData={selectedRecord} onSave={handleSaveRecord} />
      
      {/* NAYA HISTORY MODAL COMPONENT */}
      <HistoryLedgerModal 
        isOpen={historyModalState.isOpen}
        onClose={() => setHistoryModalState({ ...historyModalState, isOpen: false })}
        moduleType={historyModalState.moduleType}
        recordId={historyModalState.recordId}
        title={historyModalState.title}
      />
    </div>
  );
};

export default Udhari;