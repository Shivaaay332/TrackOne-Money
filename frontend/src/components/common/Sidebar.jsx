import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiPieChart, FiUsers, FiTarget, FiSettings, FiMenu, FiX } from 'react-icons/fi';
import logoPlaceholder from '../../assets/image.png'; // Will be placed manually by you

const navItems = [
  { path: '/', name: 'Dashboard', icon: FiHome },
  { path: '/expenses', name: 'Transactions', icon: FiPieChart },
  { path: '/udhari', name: 'Udhari', icon: FiUsers },
  { path: '/goals', name: 'Future Goals', icon: FiTarget },
  { path: '/settings', name: 'Settings', icon: FiSettings },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border w-64 shadow-xl z-50">
      {/* Brand / Logo */}
      <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-dark-border mt-4">
        <img 
          src={logoPlaceholder} 
          alt="TrackOne Logo" 
          className="h-12 w-auto object-contain"
          onError={(e) => { e.target.style.display = 'none'; }} // Fallback if image not yet placed
        />
        <h1 className="ml-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-blue-500">
          TrackOne
        </h1>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setIsOpen(false)} // Close on mobile tap
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-500 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-4" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-dark-card shadow-md text-gray-700 dark:text-gray-200"
      >
        {isOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
      </button>

      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex flex-col h-screen transition-all duration-300">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (Animated Overlay) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden"
            onClick={toggleSidebar}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="absolute top-0 left-0 h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {sidebarContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;