import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layout & Common Components
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import AppLock from './components/common/AppLock';
import AiChatWidget from './components/ai/AiChatWidget'; // <-- AI Chat Widget

// Auth Pages
import Login from './pages/authentication/Login';
import Register from './pages/authentication/Register';
import ForgotPassword from './pages/authentication/ForgotPassword';

// Main Pages
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Udhari from './pages/UdhariPage';
import FutureGoals from './pages/FutureGoals';
// Purana: import Settings from './pages/Settings';
// NAYA YEH LIKHEIN:
import Settings from './pages/SettingsPage';
import AiDashboard from './pages/AiDashboard';
import EmiTracker from './pages/EmiTracker';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Advanced App Layout containing the Lock Logic & Global AI Widget
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 relative">
          {children}
          {/* Floating Chat Widget injected globally on all protected pages */}
          <AiChatWidget /> 
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/emi-tracker" element={<ProtectedRoute><AppLayout><EmiTracker /></AppLayout></ProtectedRoute>} />

      {/* Protected Routes inside AppLayout */}
      <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute><AppLayout><AiDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><AppLayout><Expenses /></AppLayout></ProtectedRoute>} />
      <Route path="/udhari" element={<ProtectedRoute><AppLayout><Udhari /></AppLayout></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute><AppLayout><FutureGoals /></AppLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;