import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSun, FiMoon, FiLogOut, FiBell, FiWifiOff, FiRefreshCw,
  FiCheckCircle, FiX, FiAlertTriangle, FiTarget, FiCreditCard, FiInfo
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useNetwork } from '../../context/NetworkContext';
import { logout } from '../../store/authSlice';
import api from '../../services/api';

const getAssetUrl = (path) => {
  if (!path) return '';
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3001';
  return `${baseUrl}/${path.replace(/\\/g, '/')}`;
};

const notifIcon = (type) => {
  if (type === 'Budget Alert') return <FiAlertTriangle className="w-4 h-4 text-red-500" />;
  if (type === 'Goal Reminder') return <FiTarget className="w-4 h-4 text-indigo-500" />;
  if (type === 'Udhari Reminder') return <FiCreditCard className="w-4 h-4 text-amber-500" />;
  return <FiInfo className="w-4 h-4 text-blue-500" />;
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const Navbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { isOnline, isSyncing, pendingCount } = useNetwork();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const panelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifs(true);
      const { data } = await api.get('/notifications');
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error('Notification fetch failed');
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifications]);

  const handleBellClick = () => {
    setShowNotifications(v => !v);
    if (!showNotifications) fetchNotifications();
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { console.error('Mark read error'); }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) { console.error('Mark all read error'); }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="h-16 md:h-20 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#334155] flex items-center justify-between px-4 md:px-10 z-30 transition-colors duration-300 ml-12 md:ml-0">

      <div className="flex-1 overflow-hidden">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 truncate hidden sm:block">
          Welcome, {user?.name?.split(' ')[0] || 'User'}! 👋
        </h2>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">

        {/* Sync Indicator */}
        <div className="flex items-center space-x-1 md:space-x-2 text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full border dark:border-[#334155] bg-gray-50 dark:bg-[#0f172a]">
          {!isOnline ? (
            <><FiWifiOff className="text-red-500 w-3 h-3 md:w-4 md:h-4" /><span className="text-red-500 hidden sm:inline">Offline</span></>
          ) : isSyncing ? (
            <><FiRefreshCw className="text-blue-500 w-3 h-3 md:w-4 md:h-4 animate-spin" /><span className="text-blue-500 hidden sm:inline">Syncing</span></>
          ) : pendingCount > 0 ? (
            <><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500 animate-pulse" /><span className="text-amber-600 hidden sm:inline">{pendingCount} Pending</span></>
          ) : (
            <><FiCheckCircle className="text-emerald-500 w-3 h-3 md:w-4 md:h-4" /><span className="text-emerald-600 hidden sm:inline">Synced</span></>
          )}
        </div>

        {/* Theme Toggle */}
        <button onClick={toggleTheme}
          className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#334155] text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Toggle Theme">
          {isDarkMode ? <FiSun className="h-4 w-4 md:h-5 md:w-5" /> : <FiMoon className="h-4 w-4 md:h-5 md:w-5" />}
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={panelRef}>
          <button onClick={handleBellClick}
            className="relative p-1.5 md:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#334155] text-gray-600 dark:text-gray-300 transition-colors">
            <FiBell className="h-4 w-4 md:h-5 md:w-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#1e293b] px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 dark:border-[#334155] z-50 overflow-hidden">

                {/* Panel Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#334155]">
                  <div className="flex items-center space-x-2">
                    <FiBell className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium px-1">
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#334155] text-gray-400 hover:text-gray-600 transition-colors">
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-80 overflow-y-auto">
                  {loadingNotifs ? (
                    <div className="py-8 flex justify-center">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <FiBell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Koi notification nahi hai</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <motion.div key={n._id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        onClick={() => !n.isRead && markRead(n._id)}
                        className={`flex items-start space-x-3 px-4 py-3 border-b border-gray-50 dark:border-[#334155]/50 last:border-0 cursor-pointer transition-colors
                          ${!n.isRead ? 'bg-indigo-50/60 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-[#334155]/30'}`}>
                        <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${!n.isRead ? 'bg-white dark:bg-[#1e293b] shadow-sm' : 'bg-gray-100 dark:bg-[#334155]'}`}>
                          {notifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-xs font-bold truncate ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                              {n.title}
                            </p>
                            {!n.isRead && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full ml-2 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile & Logout */}
        <div className="flex items-center space-x-2 md:space-x-3 border-l pl-2 md:pl-4 dark:border-[#334155]">
          <div className="h-7 w-7 md:h-10 md:w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs md:text-sm font-bold shadow-sm md:shadow-md overflow-hidden border border-white dark:border-[#334155]">
            {user?.profilePhoto ? (
              <img src={getAssetUrl(user.profilePhoto)} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <button onClick={handleLogout}
            className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
            <FiLogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
