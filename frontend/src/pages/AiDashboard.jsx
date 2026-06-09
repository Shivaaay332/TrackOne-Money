import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiActivity, FiTrendingUp, FiAlertTriangle, FiCheckCircle,
  FiSend, FiMic, FiMicOff, FiTrash2, FiZap, FiStar,
  FiDollarSign, FiTarget, FiBarChart2, FiCpu
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api';
import { ChatStorage } from '../utils/ChatStorage';
import { parseIntent } from '../utils/IntentParser';
import { useVoiceController } from '../utils/VoiceController';

const INITIAL_MESSAGE = {
  sender: 'ai',
  text: "Namaste! 👋 Main **TrackOne AI** hun — aapka personal financial assistant.\n\nAap mujhse pooch sakte hain:\n- 💰 *\"Mera total kharcha kitna hai?\"*\n- 📊 *\"Meri bachat dikhao\"*\n- 🎯 *\"Goal progress batao\"*\n- 📋 *\"Udhari summary\"*\n- ⚡ *\"Add 500 food\"* (quick expense entry)\n\n*Hindi, English, ya Hinglish — koi bhi language mein poochho!*",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const SUGGESTIONS = [
  { label: "💸 Kharcha", query: "Mera total kharcha kitna hai?" },
  { label: "💰 Bachat", query: "Meri total bachat dikhao" },
  { label: "📋 Udhari", query: "Udhari summary batao" },
  { label: "🎯 Goals", query: "Mera goal progress kya hai?" },
  { label: "📊 Budget", query: "Mujhe budget suggest karo" },
  { label: "💡 Tips", query: "Financial tips do" },
];

const TypingDots = () => (
  <div className="flex items-center space-x-1.5 p-1">
    {[0, 0.2, 0.4].map((delay, i) => (
      <motion.div key={i} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay }}
        className="w-2 h-2 bg-indigo-400 rounded-full" />
    ))}
  </div>
);

const MessageBubble = ({ msg }) => {
  const isAI = msg.sender === 'ai';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className={`flex flex-col ${isAI ? 'items-start' : 'items-end'} mb-4`}>
      {isAI && (
        <div className="flex items-center space-x-2 mb-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <FiCpu className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">TrackOne AI</span>
        </div>
      )}
      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed
        ${!isAI
          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none'
          : 'bg-white dark:bg-[#1e293b] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-[#334155] rounded-bl-none'
        }`}>
        {isAI ? (
          <div className="prose dark:prose-invert prose-sm max-w-none
            [&>p]:mb-1.5 [&>p:last-child]:mb-0
            [&>ul]:mt-1 [&>ul]:mb-1 [&>ul>li]:mb-0.5
            [&>ol]:mt-1 [&>ol]:mb-1
            [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mt-2 [&>h3]:mb-1
            [&>strong]:font-semibold">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
          </div>
        ) : (
          <span>{msg.text}</span>
        )}
      </div>
      <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
    </motion.div>
  );
};

const ScoreRing = ({ score }) => {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * score) / 100;
  let color = '#ef4444';
  if (score >= 90) color = '#10b981';
  else if (score >= 75) color = '#3b82f6';
  else if (score >= 60) color = '#f59e0b';

  return (
    <svg width="130" height="130" className="-rotate-90">
      <circle cx="65" cy="65" r={r} fill="transparent" stroke="#e5e7eb" strokeWidth="8" className="dark:stroke-[#334155]" />
      <circle cx="65" cy="65" r={r} fill="transparent" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
    </svg>
  );
};

const AiDashboard = () => {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const stored = ChatStorage.getMessages();
    if (stored && stored.length > 0) {
      setMessages(stored.map(m => ({ ...m })));
    }
  }, []);

  useEffect(() => { ChatStorage.saveMessages(messages); }, [messages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  useEffect(() => {
    const fetchAiData = async () => {
      try {
        const { data } = await api.get('/ai/dashboard');
        setAiData(data.data);
      } catch (e) { console.error('AI dashboard fetch error'); }
      finally { setLoading(false); }
    };
    fetchAiData();
  }, []);

  const addMessage = useCallback((sender, text) => {
    setMessages(prev => [...prev, {
      sender, text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  }, []);

  const handleSend = useCallback(async (query) => {
    const text = (query || input).trim();
    if (!text || isSending) return;
    setInput('');
    addMessage('user', text);
    setIsSending(true);
    try {
      const { intent } = parseIntent(text);
      let responseText = '';
      if (intent === 'quick_entry') {
        const res = await api.post('/ai/quick-entry', { text });
        responseText = `✅ ${res.data.message}`;
      } else {
        const res = await api.post('/ai/chat', { message: text });
        responseText = res.data.reply;
      }
      addMessage('ai', responseText);
    } catch (err) {
      addMessage('ai', `⚠️ **Connection Error:** Server se connect nahi ho pa raha. Please thodi der mein try karein.`);
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, addMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClear = () => {
    if (window.confirm('Clear chat history?')) {
      ChatStorage.clearMessages();
      setMessages([INITIAL_MESSAGE]);
    }
  };

  const { isListening, toggleListening } = useVoiceController((t) => { if (t) handleSend(t); });

  const score = aiData?.score || 0;
  let scoreLabel = 'Needs Work', scoreColor = 'text-red-500', scoreBg = 'bg-red-50 dark:bg-red-900/10';
  if (score >= 90) { scoreLabel = 'Excellent'; scoreColor = 'text-emerald-500'; scoreBg = 'bg-emerald-50 dark:bg-emerald-900/10'; }
  else if (score >= 75) { scoreLabel = 'Good'; scoreColor = 'text-blue-500'; scoreBg = 'bg-blue-50 dark:bg-blue-900/10'; }
  else if (score >= 60) { scoreLabel = 'Average'; scoreColor = 'text-amber-500'; scoreBg = 'bg-amber-50 dark:bg-amber-900/10'; }

  return (
    <div className="flex flex-col lg:flex-row gap-4 overflow-hidden" style={{ height: 'calc(100vh - 6rem)' }}>

      {/* LEFT PANEL — Dashboard Stats */}
      <div className="lg:w-80 xl:w-96 flex flex-col gap-4 overflow-y-auto shrink-0">

        {/* AI Header Card */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-5 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
          <div className="relative flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FiCpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-lg leading-tight">TrackOne AI</h1>
              <p className="text-white/70 text-xs">Financial Intelligence</p>
            </div>
          </div>
          <p className="text-white/80 text-xs leading-relaxed relative">
            Aapka AI-powered financial advisor. Apne finances ke baare mein kuch bhi poochho!
          </p>
        </motion.div>

        {/* Health Score */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-[#334155] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Health Score</h3>
            <FiActivity className="text-indigo-500 w-4 h-4" />
          </div>
          {loading ? (
            <div className="flex justify-center py-4"><FiActivity className="animate-spin w-8 h-8 text-indigo-400" /></div>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="relative flex-shrink-0">
                <ScoreRing score={score} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black ${scoreColor}`}>{score}</span>
                  <span className="text-[9px] text-gray-400 font-medium">/100</span>
                </div>
              </div>
              <div>
                <p className={`font-bold text-base ${scoreColor}`}>{scoreLabel}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  {score >= 75 ? 'Aapki financial health bahut achhi hai!' : 'Apni finances improve karne ki zarurat hai.'}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* AI Action Plan */}
        {!loading && aiData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-[#334155] p-5 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">AI Action Plan</h3>
              <FiZap className="text-amber-500 w-4 h-4" />
            </div>
            <div className="space-y-3">
              {aiData.recommendations?.length > 0 ? (
                aiData.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl">
                    <FiAlertTriangle className="text-red-500 mt-0.5 mr-2.5 flex-shrink-0 w-4 h-4" />
                    <p className="text-xs font-medium text-red-700 dark:text-red-300 leading-relaxed">{rec}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-start p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl">
                  <FiCheckCircle className="text-emerald-500 mt-0.5 mr-2.5 flex-shrink-0 w-4 h-4" />
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 leading-relaxed">Finances ekdum perfect shape mein hain! 🎉</p>
                </div>
              )}
              {aiData.insights?.map((ins, i) => (
                <div key={i} className="flex items-start p-3 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-xl">
                  <FiTrendingUp className="text-indigo-500 mt-0.5 mr-2.5 flex-shrink-0 w-4 h-4" />
                  <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 leading-relaxed">{ins}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-2">
          {[
            { icon: FiDollarSign, label: 'Income', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
            { icon: FiBarChart2, label: 'Expenses', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10' },
            { icon: FiTarget, label: 'Goals', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
          ].map(({ icon: Icon, label, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-3 flex flex-col items-center text-center border border-transparent`}>
              <Icon className={`${color} w-4 h-4 mb-1`} />
              <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* RIGHT PANEL — Chat */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
        className="flex-1 flex flex-col rounded-2xl bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-[#334155] shadow-sm overflow-hidden min-h-0">

        {/* Chat Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <FiCpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">TrackOne AI Chat</p>
              <div className="flex items-center space-x-1 mt-0.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-white/70 text-xs">Online — Hindi / English / Hinglish</span>
              </div>
            </div>
          </div>
          <button onClick={handleClear}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Clear chat">
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Suggestions */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-[#0f172a] border-b border-gray-100 dark:border-[#334155] overflow-x-auto no-scrollbar shrink-0">
          <div className="flex space-x-2">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => handleSend(s.query)}
                className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50 dark:bg-[#0f172a] min-h-0">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          </AnimatePresence>

          {isSending && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start mb-4">
              <div className="flex items-center space-x-2 mb-1.5 mr-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mt-0.5">
                  <FiCpu className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-[#334155] rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                <TypingDots />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-4 py-3 bg-white dark:bg-[#1e293b] border-t border-gray-100 dark:border-[#334155] shrink-0">
          <div className="flex items-center space-x-2">
            <button onClick={toggleListening} disabled={isSending}
              className={`p-2.5 rounded-xl transition-all shrink-0 ${isListening
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 animate-pulse'
                : 'bg-gray-100 dark:bg-[#0f172a] text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600'
              } disabled:opacity-40`}>
              {isListening ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              placeholder={isSending ? "AI soch raha hai..." : "Kuch bhi poochho... (Enter to send)"}
              className="flex-1 bg-gray-100 dark:bg-[#0f172a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2.5 rounded-xl outline-none text-sm focus:ring-2 focus:ring-indigo-500/30 transition-all disabled:opacity-60"
            />
            <button
              onClick={() => handleSend()}
              disabled={isSending || !input.trim()}
              className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0">
              <FiSend className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
            AI financial advice ke liye — accurate data ke liye expenses, income track karte raho
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AiDashboard;
