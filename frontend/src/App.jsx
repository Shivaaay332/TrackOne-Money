import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import AppLock from './components/common/AppLock';

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Udhari from './pages/Udhari';
import FutureGoals from './pages/FutureGoals';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Advanced App Layout containing the Lock Logic
const AppLayout = ({ children }) => {
  const { user } = useSelector(state => state.auth);
  const [isUnlocked, setIsUnlocked] = useState(!user?.isPinEnabled);

  // If user has PIN enabled and hasn't unlocked it yet, show Lock Screen
  if (user?.isPinEnabled && !isUnlocked) {
    return <AppLock onUnlock={() => setIsUnlocked(true)} userName={user?.name?.split(' ')[0]} />;
  }

  return (
    <div className="flex h-screen bg-[#F4F7FE] dark:bg-[#0f172a] transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><AppLayout><Expenses /></AppLayout></ProtectedRoute>} />
      <Route path="/udhari" element={<ProtectedRoute><AppLayout><Udhari /></AppLayout></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute><AppLayout><FutureGoals /></AppLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;