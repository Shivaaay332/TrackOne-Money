import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TypingEffect from './TypingEffect';
import { motion } from 'framer-motion';

const ChatMessages = ({ messages, isTyping }) => {
  const containerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (autoScroll && containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [autoScroll]);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
  };

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 p-4 overflow-y-auto bg-[#F4F7FE] dark:bg-[#0f172a] space-y-4">
      {messages.map((msg, i) => {
        const isAI = msg.sender === 'ai';
        const isTypingMessage = isAI && msg.isTypingEffect;

        return (
          <div key={i} className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${!isAI ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm' : 'bg-white dark:bg-[#1e293b] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-[#334155] rounded-bl-sm'}`}>
              {isTypingMessage ? (
                <TypingEffect text={msg.text} onComplete={() => msg.isTypingEffect = false} />
              ) : (
                <div className="prose dark:prose-invert prose-sm max-w-none [&>p]:mb-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        );
      })}

      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl rounded-bl-sm shadow-sm flex space-x-1">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ChatMessages);