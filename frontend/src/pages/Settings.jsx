import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiUser, FiMoon, FiSun, FiDownload, FiUpload, FiTrash2, FiAlertTriangle, FiCheck, FiLock } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { updateUser, logout } from '../store/authSlice';
import api from '../services/api';

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '', password: '' });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [pinMode, setPinMode] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  const showStatus = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 5000);
  };

  // Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);
      if (profileData.password) formData.append('password', profileData.password);
      if (profilePhoto) formData.append('profilePhoto', profilePhoto);

      const response = await api.put('/settings/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      dispatch(updateUser(response.data));
      showStatus('Profile updated successfully!');
      setProfileData({ ...profileData, password: '' });
    } catch (error) {
      showStatus(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Setup PIN Lock
  const handleSetupPin = async (e) => {
    e.preventDefault();
    if (pinInput.length !== 4) return showStatus('PIN must be 4 digits', 'error');
    try {
      await api.post('/auth/setup-pin', { pin: pinInput });
      showStatus('Security PIN enabled successfully!');
      setPinInput('');
      setPinMode(false);
    } catch (error) {
      showStatus(error.response?.data?.message || 'Failed to set PIN', 'error');
    }
  };

  // Export Data (Backup)
  const handleExportBackup = async () => {
    try {
      const response = await api.get('/settings/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TrackOne_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showStatus('Backup downloaded successfully!');
    } catch (error) {
      showStatus('Failed to generate backup', 'error');
    }
  };

  // Import Data (Restore)
  const handleImportBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        await api.post('/settings/restore', jsonData);
        showStatus('Data restored successfully! Please refresh.', 'success');
      } catch (error) {
        showStatus('Invalid JSON or restore failed', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  // Factory Reset
  const handleFactoryReset = async () => {
    const pin = window.prompt("WARNING: This will delete ALL transactions, goals, and udhari records. Enter your 4-digit PIN to confirm:");
    if (!pin) return;
    
    try {
      await api.delete('/settings/factory-reset', { data: { pin } });
      dispatch(logout()); // Force logout after reset
      window.location.href = '/login';
    } catch (error) {
      showStatus(error.response?.data?.message || 'Factory reset failed. Incorrect PIN?', 'error');
    }
  };

  return (
    <div className="pb-10 max-w-5xl mx-auto h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your profile, app preferences, and data.</p>
      </div>

      {statusMsg.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center ${statusMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'}`}>
          {statusMsg.type === 'error' ? <FiAlertTriangle className="mr-3 w-5 h-5" /> : <FiCheck className="mr-3 w-5 h-5" />}
          <span className="font-medium">{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile & Security */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Form */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center"><FiUser className="mr-2" /> Profile Information</h3>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-sm overflow-hidden">
                  {profilePhoto ? <img src={URL.createObjectURL(profilePhoto)} alt="Avatar" className="h-full w-full object-cover" /> : user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <button type="button" onClick={() => fileInputRef.current.click()} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">Change Photo</button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => setProfilePhoto(e.target.files[0])} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input type="text" required value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input type="email" required value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password (leave blank to keep current)</label>
                <input type="password" value={profileData.password} onChange={(e) => setProfileData({...profileData, password: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="••••••••" />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={loading} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-sm transition-colors disabled:opacity-70">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Security / PIN Setup */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center"><FiLock className="mr-2" /> Application Security</h3>
            {pinMode ? (
              <form onSubmit={handleSetupPin} className="flex items-end space-x-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enter 4-Digit PIN</label>
                  <input type="password" maxLength="4" required value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/, ''))} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="1234" />
                </div>
                <button type="submit" className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-medium transition-colors">Set PIN</button>
                <button type="button" onClick={() => setPinMode(false)} className="px-4 py-2 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 transition-colors">Cancel</button>
              </form>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">App Lock PIN</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Require a PIN for sensitive actions like Factory Reset.</p>
                </div>
                <button onClick={() => setPinMode(true)} className="px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">
                  Setup PIN
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Theme & Data Management */}
        <div className="space-y-6">
          
          {/* Preferences */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Preferences</h3>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-100 dark:border-dark-border">
              <div className="flex items-center space-x-3">
                {isDarkMode ? <FiMoon className="text-indigo-500" /> : <FiSun className="text-amber-500" />}
                <span className="font-medium text-gray-800 dark:text-gray-200">Dark Theme</span>
              </div>
              <button 
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-primary-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div className="premium-card p-6 border-t-4 border-t-blue-500">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Data Management</h3>
            
            <div className="space-y-3">
              <button onClick={handleExportBackup} className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-dark-border rounded-xl transition-colors border border-gray-100 dark:border-dark-border group">
                <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Backup Data (JSON)</span>
                <FiDownload className="text-gray-400 group-hover:text-blue-600" />
              </button>

              <button onClick={() => jsonInputRef.current.click()} className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-dark-border rounded-xl transition-colors border border-gray-100 dark:border-dark-border group">
                <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Restore Data</span>
                <FiUpload className="text-gray-400 group-hover:text-emerald-600" />
              </button>
              <input type="file" ref={jsonInputRef} className="hidden" accept=".json" onChange={handleImportBackup} />
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-dark-border">
              <h4 className="text-sm font-bold text-red-500 mb-2 uppercase tracking-wider">Danger Zone</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Permanently delete all your tracked financial data. This cannot be undone without a backup.</p>
              <button onClick={handleFactoryReset} className="w-full flex justify-center items-center space-x-2 px-4 py-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-colors">
                <FiTrash2 />
                <span>Factory Reset</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;