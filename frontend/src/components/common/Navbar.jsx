import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiSun, FiMoon, FiLogOut, FiBell, FiWifiOff, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';

import { useTheme } from '../../context/ThemeContext';
import { useNetwork } from '../../context/NetworkContext';
import { logout } from '../../store/authSlice';

const getAssetUrl = (path) => {
  if (!path) return '';
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  return `${baseUrl}/${path.replace(/\\/g, '/')}`;
};

const Navbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { isOnline, isSyncing, pendingCount } = useNetwork();
  
  // Naya State Notification Panel Ke Liye
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="h-16 md:h-20 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#334155] flex items-center justify-between px-4 md:px-10 z-30 transition-colors duration-300 ml-12 md:ml-0">
      
      {/* Left Side: Welcome Message (Hidden on very small screens) */}
      <div className="flex-1 overflow-hidden">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 truncate hidden sm:block">
          Welcome, {user?.name?.split(' ')[0] || 'User'}! 👋
        </h2>
      </div>

      {/* Right Side: Icons & Profile */}
      <div className="flex items-center space-x-2 md:space-x-4">
        
        {/* Sync Indicator (Mobile pe compact) */}
        <div className="flex items-center space-x-1 md:space-x-2 mr-1 text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full border dark:border-[#334155] bg-gray-50 dark:bg-[#0f172a]">
          {!isOnline ? (
            <><FiWifiOff className="text-red-500 w-3 h-3 md:w-4 md:h-4" /><span className="text-red-500 hidden sm:inline">Offline</span></>
          ) : isSyncing ? (
            <><FiRefreshCw className="text-blue-500 w-3 h-3 md:w-4 md:h-4 animate-spin" /><span className="text-blue-500 hidden sm:inline">Syncing</span></>
          ) : pendingCount > 0 ? (
            <><span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500 animate-pulse"></span><span className="text-amber-600 hidden sm:inline">{pendingCount} Pending</span></>
          ) : (
            <><FiCheckCircle className="text-emerald-500 w-3 h-3 md:w-4 md:h-4" /><span className="text-emerald-600 hidden sm:inline">Synced</span></>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#334155] text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <FiSun className="h-4 w-4 md:h-5 md:w-5" /> : <FiMoon className="h-4 w-4 md:h-5 md:w-5" />}
        </button>

        {/* Notification Bell with Simple Popup */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 md:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#334155] text-gray-600 dark:text-gray-300 transition-colors"
          >
            <FiBell className="h-4 w-4 md:h-5 md:w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 md:h-2.5 md:w-2.5 bg-red-500 rounded-full border border-white dark:border-[#1e293b]"></span>
          </button>
          
          {/* Dummy Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-48 md:w-64 bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-gray-100 dark:border-[#334155] p-3 z-50">
               <p className="text-xs md:text-sm font-bold text-gray-800 dark:text-gray-200 border-b dark:border-gray-600 pb-2 mb-2">Notifications</p>
               <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Welcome to TrackOne! App installed successfully.</p>
            </div>
          )}
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
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
          >
            <FiLogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;