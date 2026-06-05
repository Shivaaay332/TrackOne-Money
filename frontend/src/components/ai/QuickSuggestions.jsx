import React from 'react';

const SUGGESTIONS = [
  "How much did I spend this month?", "Show my total savings", "Suggest a budget", "What is my goal progress?", "Udhari summary"
];

const QuickSuggestions = ({ onSelect }) => {
  return (
    <div className="px-4 py-2 border-t border-gray-100 dark:border-[#334155] bg-gray-50 dark:bg-[#0f172a] overflow-x-auto no-scrollbar flex space-x-2 shrink-0">
      {SUGGESTIONS.map((text, i) => (
        <button key={i} onClick={() => onSelect(text)} className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          {text}
        </button>
      ))}
    </div>
  );
};

export default React.memo(QuickSuggestions);