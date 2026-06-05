import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare } from 'react-icons/fi';
import api from '../../services/api';

import { ChatStorage } from '../../utils/ChatStorage';
import { parseIntent } from '../../utils/IntentParser';
import { useVoiceController } from '../../utils/VoiceController';

import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import QuickSuggestions from './QuickSuggestions';
import ChatInput from './ChatInput';

const INITIAL_MESSAGE = { 
  sender: 'ai', 
  text: "Hi! I'm TrackOne AI. Ask me about your spending, savings, or say 'Add 500 for food'.\n\n(Aap mujhse Hindi/Hinglish mein bhi baat kar sakte hain!)",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  isTypingEffect: false
};

const AiChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [contextData, setContextData] = useState(null);
  const [isContextLoading, setIsContextLoading] = useState(false);

  useEffect(() => {
    const history = ChatStorage.getMessages();
    if (history && history.length > 0) {
      setMessages(history.map(m => ({ ...m, isTypingEffect: false })));
    }
  }, []);

  useEffect(() => { ChatStorage.saveMessages(messages); }, [messages]);

  useEffect(() => {
    if (isOpen && !contextData) {
      const fetchContext = async () => {
        setIsContextLoading(true);
        try {
          const { data } = await api.get('/ai/dashboard');
          setContextData(data.data);
        } catch (e) { console.error("Failed to load AI Context"); } 
        finally { setIsContextLoading(false); }
      };
      fetchContext();
    }
  }, [isOpen, contextData]);

  const addMessage = useCallback((sender, text, isTypingEffect = false) => {
    setMessages(prev => [...prev, { sender, text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isTypingEffect }]);
  }, []);

  const handleClear = useCallback(() => {
    if(window.confirm("Clear chat history?")) {
      ChatStorage.clearMessages();
      setMessages([INITIAL_MESSAGE]);
    }
  }, []);

  const handleSend = useCallback(async (query) => {
    addMessage('user', query);
    setIsLoading(true);

    try {
      const { intent } = parseIntent(query);
      let responseText = '';
      
      if (intent === 'quick_entry') {
        const res = await api.post('/ai/quick-entry', { text: query });
        responseText = `✅ ${res.data.message}`;
      } else {
        const res = await api.post('/ai/chat', { message: query });
        responseText = res.data.reply;
      }
      
      addMessage('ai', responseText, true);
    } catch (error) {
      addMessage('ai', `⚠️ **Error:** I'm having trouble connecting to the server.`, false);
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const { isListening, toggleListening, error: voiceError } = useVoiceController((transcript) => {
    if (transcript) handleSend(transcript);
  });

  useEffect(() => {
    if (voiceError) addMessage('ai', `🎤 Microphone error: ${voiceError}`);
  }, [voiceError, addMessage]);

  return (
    <>
      <motion.button 
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 text-white rounded-full shadow-2xl z-40 flex items-center justify-center ${isOpen ? 'bg-gray-800' : 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/50'}`}
      >
        <FiMessageSquare className="w-7 h-7" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.95 }} transition={{ duration: 0.2 }}
            className="fixed z-50 flex flex-col overflow-hidden bg-white dark:bg-[#1e293b] shadow-2xl border-gray-200 dark:border-[#334155] inset-0 w-full h-full rounded-none md:inset-auto md:bottom-24 md:right-6 md:w-[400px] md:h-[650px] md:rounded-2xl md:border"
          >
            <ChatHeader onClose={() => setIsOpen(false)} onClear={handleClear} contextData={contextData} isContextLoading={isContextLoading} />
            <QuickSuggestions onSelect={handleSend} />
            <ChatMessages messages={messages} isTyping={isLoading} />
            <ChatInput onSend={handleSend} isLoading={isLoading} isListening={isListening} toggleListening={toggleListening} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiChatWidget;