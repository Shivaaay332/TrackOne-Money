import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiClock, FiPlus, FiImage, FiTrash2, FiFileText } from 'react-icons/fi';
import api from '../../services/api';

const getAssetUrl = (path) => {
  if (!path) return '';
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  return `${baseUrl}/${path.replace(/\\/g, '/')}`;
};

const HistoryLedgerModal = ({ isOpen, onClose, onUpdate, moduleType, recordId, title }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({ amount: '', actionType: 'Paid', date: new Date().toISOString().split('T')[0], note: '' });
  const [receiptFile, setReceiptFile] = useState(null);

  // Udhari aur EMI dono auto-managed hain
  const isViewOnly = moduleType === 'EMI' || moduleType === 'Udhari';

  const fetchHistory = async () => {
    try {
      const { data } = await api.get(`/history/${moduleType}/${recordId}`);
      setLogs(data.data);
    } catch (error) { console.error("Failed to load history"); }
  };

  useEffect(() => {
    if (isOpen) { fetchHistory(); setViewMode('list'); }
  }, [isOpen, moduleType, recordId]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const form = new FormData();
      form.append('moduleType', moduleType);
      form.append('recordId', recordId);
      form.append('amount', formData.amount);
      form.append('actionType', formData.actionType);
      form.append('date', formData.date);
      form.append('note', formData.note);
      if (receiptFile) form.append('receiptImage', receiptFile);

      await api.post('/history', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      fetchHistory(); 
      setViewMode('list');
      setFormData({ amount: '', actionType: 'Paid', date: new Date().toISOString().split('T')[0], note: '' });
      setReceiptFile(null);
      
      if(onUpdate) onUpdate(); 

    } catch (error) { alert("Failed to add record"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Permanently delete this record? This will also reverse the main balance and adjust your progress.")) {
      await api.delete(`/history/${id}`);
      fetchHistory();
      if(onUpdate) onUpdate();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 dark:border-[#334155] flex flex-col max-h-[90vh]">
          
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-[#334155] bg-gray-50 dark:bg-[#0f172a]">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <FiClock className="mr-2 text-indigo-500" /> 
                {moduleType === 'EMI' ? 'EMI Payment Timeline' : (moduleType === 'Udhari' ? 'Udhari History' : 'Detailed Ledger')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{moduleType}: <span className="font-bold text-indigo-600">{title}</span></p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors dark:text-gray-400"><FiX className="w-6 h-6" /></button>
          </div>

          <div className="flex border-b border-gray-200 dark:border-[#334155]">
            <button onClick={() => setViewMode('list')} className={`flex-1 py-3 text-sm font-bold ${viewMode === 'list' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-[#0f172a]'}`}>
              View Records ({logs.length})
            </button>
            
            {/* 🔥 Udhari aur EMI dono ke liye Add Payment hide kar diya hai 🔥 */}
            {!isViewOnly && (
              <button onClick={() => setViewMode('add')} className={`flex-1 py-3 text-sm font-bold flex justify-center items-center ${viewMode === 'add' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-[#0f172a]'}`}>
                <FiPlus className="mr-1"/> Add Payment
              </button>
            )}
          </div>

          <div className="p-6 overflow-y-auto flex-1 bg-gray-50 dark:bg-[#0f172a]">
            {viewMode === 'list' && (
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <div className="text-center py-10 text-gray-500"><FiFileText className="w-12 h-12 mx-auto mb-3 opacity-30"/> No history records found.</div>
                ) : (
                  logs.map(log => (
                    <div key={log._id} className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-[#334155] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${log.actionType === 'Added' || log.actionType === 'Received' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {log.actionType}
                          </span>
                          <span className="font-bold text-gray-800 dark:text-gray-200 text-lg">₹{log.amount.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 font-medium">{new Date(log.date).toDateString()}</p>
                        
                        {log.note && (
                          <div className={`mt-2 text-sm p-2.5 rounded-lg border ${isViewOnly ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 font-medium' : 'bg-gray-50 border-gray-100 text-gray-600 dark:bg-[#0f172a] dark:border-[#1e293b] dark:text-gray-400 italic'}`}>
                            {isViewOnly ? `✨ ${log.note}` : `"${log.note}"`}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-gray-100 dark:border-[#334155] pt-3 md:pt-0">
                        {log.receiptImage && (
                          <a href={getAssetUrl(log.receiptImage)} target="_blank" rel="noreferrer" className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
                            <FiImage className="mr-1"/> View Receipt
                          </a>
                        )}

                        {/* 🔥 Udhari aur EMI dono ke liye Delete button hide kar diya hai 🔥 */}
                        {!isViewOnly && (
                          <button onClick={() => handleDelete(log._id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg tooltip" title="Delete Record">
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {viewMode === 'add' && !isViewOnly && (
              <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-gray-100 dark:border-[#334155] space-y-4">
                 {/* ... (Form code unchanged) ... */}
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default HistoryLedgerModal;