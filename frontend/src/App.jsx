import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layout & Common Components
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';

// Auth Pages (Placeholders for now, will implement in next part)
const Login = () => <div className="p-10">Login Page (Coming in Part 6)</div>;
const Register = () => <div className="p-10">Register Page</div>;
const ForgotPassword = () => <div className="p-10">Forgot Password</div>;

// Main Pages (Placeholders for now, will implement in next part)
const Dashboard = () => <div className="p-10 text-2xl">Dashboard Module</div>;
const Expenses = () => <div className="p-10 text-2xl">Income/Expense Module</div>;
const Udhari = () => <div className="p-10 text-2xl">Udhari Module</div>;
const FutureGoals = () => <div className="p-10 text-2xl">Future Goals Module</div>;
const Settings = () => <div className="p-10 text-2xl">Settings Module</div>;

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Layout Wrapper
const AppLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-dark-bg p-4 md:p-6">
          {children}
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

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
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