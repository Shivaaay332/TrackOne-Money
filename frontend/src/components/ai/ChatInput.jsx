import React, { useState } from 'react';
import { FiSend, FiMic, FiMicOff } from 'react-icons/fi';

const ChatInput = ({ onSend, isLoading, isListening, toggleListening }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const sanitized = input.substring(0, 500).trim();
    onSend(sanitized);
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-[#1e293b] border-t border-gray-100 dark:border-[#334155] flex items-center space-x-2 shrink-0">
      <button type="button" onClick={toggleListening} disabled={isLoading} className={`p-2.5 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 dark:bg-[#0f172a] dark:text-gray-400 hover:bg-gray-200'} disabled:opacity-50`}>
        {isListening ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
      </button>
      <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} placeholder={isLoading ? "AI is thinking..." : "Type or speak..."} className="flex-1 bg-gray-100 dark:bg-[#0f172a] text-gray-900 dark:text-white px-4 py-2.5 rounded-xl outline-none text-sm disabled:opacity-70" />
      <button type="submit" disabled={isLoading || !input.trim()} className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50">
        <FiSend className="w-5 h-5" />
      </button>
    </form>
  );
};

export default React.memo(ChatInput);