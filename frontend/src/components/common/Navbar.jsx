import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiSun, FiMoon, FiLogOut, FiBell } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { logout } from '../../store/authSlice';

// Helper to construct the full image URL from backend
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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="h-20 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#334155] flex items-center justify-between px-6 md:px-10 z-30 ml-12 md:ml-0 transition-colors duration-300">
      
      <div className="flex-1">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 hidden sm:block">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
        </h2>
      </div>

      <div className="flex items-center space-x-4 md:space-x-6">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#334155] text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
        </button>

        <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#334155] text-gray-600 dark:text-gray-300 transition-colors">
          <FiBell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1e293b]"></span>
        </button>

        <div className="flex items-center space-x-3 border-l pl-4 dark:border-[#334155]">
          {/* Enhanced Avatar Render Logic */}
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden border-2 border-white dark:border-[#334155]">
            {user?.profilePhoto ? (
              <img src={getAssetUrl(user.profilePhoto)} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-sm font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
          >
            <FiLogOut className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;