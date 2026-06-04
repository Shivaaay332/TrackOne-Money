import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiUser, FiMoon, FiSun, FiDownload, FiUpload, FiTrash2, FiAlertTriangle, FiCheck, FiLock, FiShieldOff } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { updateUser, logout } from '../store/authSlice';
import api from '../services/api';

// Helper to construct the full image URL from backend
const getAssetUrl = (path) => {
  if (!path) return '';
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  return `${baseUrl}/${path.replace(/\\/g, '/')}`;
};

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '', password: '' });
  const [profilePhoto, setProfilePhoto] = useState(null); // Holds the selected file for upload
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  
  // Security States
  const [securityMode, setSecurityMode] = useState('idle'); 
  const [pinInputs, setPinInputs] = useState({ oldPin: '', newPin: '' });
  
  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  const showStatus = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 5000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);
      if (profileData.password) formData.append('password', profileData.password);
      if (profilePhoto) formData.append('profilePhoto', profilePhoto);

      const response = await api.put('/settings/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      // Update local storage and redux with new data including photo
      dispatch(updateUser(response.data));
      showStatus('Profile updated successfully!');
      setProfileData({ ...profileData, password: '' });
      setProfilePhoto(null); // Clear selected file preview so it falls back to server URL
    } catch (error) {
      showStatus(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally { setLoading(false); }
  };

  const handleSetupPin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/setup-pin', { pin: pinInputs.newPin });
      dispatch(updateUser({ isPinEnabled: true }));
      showStatus(data.message);
      setSecurityMode('idle'); setPinInputs({ oldPin: '', newPin: '' });
    } catch (error) { showStatus(error.response?.data?.message, 'error'); }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/change-pin', { oldPin: pinInputs.oldPin, newPin: pinInputs.newPin });
      showStatus(data.message);
      setSecurityMode('idle'); setPinInputs({ oldPin: '', newPin: '' });
    } catch (error) { showStatus(error.response?.data?.message, 'error'); }
  };

  const handleRemovePin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.delete('/auth/remove-pin', { data: { pin: pinInputs.oldPin } });
      dispatch(updateUser({ isPinEnabled: false }));
      showStatus(data.message);
      setSecurityMode('idle'); setPinInputs({ oldPin: '', newPin: '' });
    } catch (error) { showStatus(error.response?.data?.message, 'error'); }
  };

  const handleExportBackup = async () => {
    try {
      const response = await api.get('/settings/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `TrackOne_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link); link.click(); link.parentNode.removeChild(link);
      showStatus('Backup downloaded successfully!');
    } catch (error) { showStatus('Failed to generate backup', 'error'); }
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await api.post('/settings/restore', JSON.parse(event.target.result));
        showStatus('Data restored successfully! Please refresh.', 'success');
      } catch (error) { showStatus('Invalid JSON or restore failed', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleFactoryReset = async () => {
    const pin = window.prompt("WARNING: This deletes ALL records. Enter 4-digit PIN to confirm:");
    if (!pin) return;
    try {
      await api.delete('/settings/factory-reset', { data: { pin } });
      dispatch(logout()); window.location.href = '/login';
    } catch (error) { showStatus(error.response?.data?.message || 'Factory reset failed.', 'error'); }
  };

  return (
    <div className="pb-10 max-w-5xl mx-auto h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your profile, app preferences, and data.</p>
      </div>

      {statusMsg.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center shadow-sm ${statusMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'}`}>
          {statusMsg.type === 'error' ? <FiAlertTriangle className="mr-3 w-5 h-5" /> : <FiCheck className="mr-3 w-5 h-5" />}
          <span className="font-medium">{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center"><FiUser className="mr-2 text-blue-500" /> Profile Information</h3>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden border-2 border-gray-100 dark:border-[#334155]">
                  {/* Photo Display Logic: Show local preview if new file selected, else show server image, else show initial */}
                  {profilePhoto ? (
                    <img src={URL.createObjectURL(profilePhoto)} alt="Avatar" className="h-full w-full object-cover" />
                  ) : user?.profilePhoto ? (
                    <img src={getAssetUrl(user.profilePhoto)} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <button type="button" onClick={() => fileInputRef.current.click()} className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">Change Photo</button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => setProfilePhoto(e.target.files[0])} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input type="text" required value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-[#334155] bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input type="email" required value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-[#334155] bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password (leave blank to keep current)</label>
                <input type="password" value={profileData.password} onChange={(e) => setProfileData({...profileData, password: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-[#334155] bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="premium-card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center"><FiLock className="mr-2 text-emerald-500" /> App Security Lock</h3>
            
            {securityMode === 'idle' && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 dark:bg-[#0f172a] p-4 rounded-xl border border-gray-100 dark:border-[#334155]">
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-200">{user?.isPinEnabled ? 'PIN Lock is Active' : 'App is Unprotected'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Require a 4-digit PIN on startup.</p>
                </div>
                <div className="mt-3 sm:mt-0 flex space-x-2">
                  {!user?.isPinEnabled ? (
                    <button onClick={() => setSecurityMode('setup')} className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg font-bold transition-colors">Set PIN</button>
                  ) : (
                    <>
                      <button onClick={() => setSecurityMode('change')} className="px-4 py-2 border border-gray-300 dark:border-[#334155] text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-[#1e293b] transition-colors">Change</button>
                      <button onClick={() => setSecurityMode('remove')} className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 rounded-lg font-bold transition-colors"><FiShieldOff className="inline mr-1"/> Remove</button>
                    </>
                  )}
                </div>
              </div>
            )}

            {securityMode === 'setup' && (
              <form onSubmit={handleSetupPin} className="bg-gray-50 dark:bg-[#0f172a] p-4 rounded-xl border border-gray-100 dark:border-[#334155]">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Create 4-Digit PIN</label>
                <div className="flex space-x-3">
                  <input type="password" maxLength="4" required value={pinInputs.newPin} onChange={(e) => setPinInputs({...pinInputs, newPin: e.target.value.replace(/\D/g, '')})} className="w-32 px-4 py-2 rounded-xl text-center tracking-widest font-bold border border-gray-300 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="••••" />
                  <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold shadow-md hover:bg-emerald-600 transition-colors">Enable Lock</button>
                  <button type="button" onClick={() => setSecurityMode('idle')} className="px-4 py-2 bg-gray-200 dark:bg-[#334155] text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-colors">Cancel</button>
                </div>
              </form>
            )}

            {securityMode === 'change' && (
              <form onSubmit={handleChangePin} className="bg-gray-50 dark:bg-[#0f172a] p-4 rounded-xl border border-gray-100 dark:border-[#334155] space-y-3">
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Old PIN</label>
                    <input type="password" maxLength="4" required value={pinInputs.oldPin} onChange={(e) => setPinInputs({...pinInputs, oldPin: e.target.value.replace(/\D/g, '')})} className="w-full px-4 py-2 rounded-xl text-center tracking-widest font-bold border border-gray-300 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white outline-none" placeholder="••••" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">New PIN</label>
                    <input type="password" maxLength="4" required value={pinInputs.newPin} onChange={(e) => setPinInputs({...pinInputs, newPin: e.target.value.replace(/\D/g, '')})} className="w-full px-4 py-2 rounded-xl text-center tracking-widest font-bold border border-gray-300 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••" />
                  </div>
                </div>
                <div className="flex space-x-3 pt-2">
                  <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors">Update PIN</button>
                  <button type="button" onClick={() => setSecurityMode('idle')} className="flex-1 py-2 bg-gray-200 dark:bg-[#334155] text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-colors">Cancel</button>
                </div>
              </form>
            )}

            {securityMode === 'remove' && (
              <form onSubmit={handleRemovePin} className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/30">
                <label className="block text-sm font-bold text-red-700 dark:text-red-400 mb-2">Enter Current PIN to Remove Lock</label>
                <div className="flex space-x-3">
                  <input type="password" maxLength="4" required value={pinInputs.oldPin} onChange={(e) => setPinInputs({...pinInputs, oldPin: e.target.value.replace(/\D/g, '')})} className="w-32 px-4 py-2 rounded-xl text-center tracking-widest font-bold border border-red-300 dark:border-red-800 bg-white dark:bg-[#0f172a] text-red-900 dark:text-red-400 focus:ring-2 focus:ring-red-500 outline-none" placeholder="••••" />
                  <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors">Remove</button>
                  <button type="button" onClick={() => setSecurityMode('idle')} className="px-4 py-2 bg-gray-200 dark:bg-[#334155] text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-colors">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="premium-card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Preferences</h3>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-[#0f172a] rounded-xl border border-gray-100 dark:border-[#334155]">
              <div className="flex items-center space-x-3">
                {isDarkMode ? <FiMoon className="text-indigo-400" /> : <FiSun className="text-amber-500" />}
                <span className="font-bold text-gray-800 dark:text-gray-200">Dark Theme</span>
              </div>
              <button onClick={toggleTheme} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="premium-card p-6 border-t-4 border-t-blue-500">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Data Management</h3>
            <div className="space-y-3">
              <button onClick={handleExportBackup} className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-[#0f172a] hover:bg-gray-100 dark:hover:bg-[#1e293b] rounded-xl transition-colors border border-gray-100 dark:border-[#334155] group shadow-sm">
                <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Backup Data (JSON)</span>
                <FiDownload className="text-gray-400 group-hover:text-blue-600" />
              </button>
              <button onClick={() => jsonInputRef.current.click()} className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-[#0f172a] hover:bg-gray-100 dark:hover:bg-[#1e293b] rounded-xl transition-colors border border-gray-100 dark:border-[#334155] group shadow-sm">
                <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Restore Data</span>
                <FiUpload className="text-gray-400 group-hover:text-emerald-600" />
              </button>
              <input type="file" ref={jsonInputRef} className="hidden" accept=".json" onChange={handleImportBackup} />
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#334155]">
              <h4 className="text-sm font-black text-red-500 mb-2 uppercase tracking-wider">Danger Zone</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Permanently delete all your financial data. Cannot be undone.</p>
              <button onClick={handleFactoryReset} className="w-full flex justify-center items-center space-x-2 px-4 py-2.5 border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-all shadow-sm">
                <FiTrash2 /> <span>Factory Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;