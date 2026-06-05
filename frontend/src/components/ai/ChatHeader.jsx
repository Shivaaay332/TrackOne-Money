import React from 'react';
import { FiX, FiTrash2, FiActivity } from 'react-icons/fi';

const ChatHeader = ({ onClose, onClear, contextData, isContextLoading }) => {
  return (
    <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex flex-col shrink-0">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg flex items-center">✨ TrackOne AI</h3>
        <div className="flex space-x-2">
          <button onClick={onClear} className="p-1.5 hover:bg-white/20 rounded-lg transition tooltip" title="Clear History"><FiTrash2 className="w-5 h-5" /></button>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition"><FiX className="w-6 h-6" /></button>
        </div>
      </div>
      <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-1">
        <div className="bg-white/10 px-2 py-1 rounded text-xs font-medium whitespace-nowrap flex items-center">
          {isContextLoading ? <FiActivity className="animate-spin mr-1"/> : 'Score: '} 
          <span className="font-bold ml-1 text-emerald-300">{contextData?.score || '--'}/100</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatHeader);