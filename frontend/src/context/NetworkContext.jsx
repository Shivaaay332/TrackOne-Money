import React, { createContext, useState, useEffect, useContext } from 'react';
import { getQueue, removeFromQueue } from '../utils/db';
import axios from 'axios';

const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Check pending queue length
  const updateQueueCount = async () => {
    const queue = await getQueue();
    setPendingCount(queue.length);
  };

  // The Auto-Sync Engine
  const processQueue = async () => {
    const queue = await getQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

    for (const req of queue) {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const headers = { ...req.headers, Authorization: `Bearer ${user?.token}` };
        
        // Execute the queued request directly via axios to bypass interceptor loops
        await axios({
          url: `${baseURL}${req.url.replace(baseURL, '')}`,
          method: req.method,
          data: req.data,
          headers
        });

        // If successful, remove from queue (Latest Update Wins handled chronologically)
        await removeFromQueue(req.id);
      } catch (error) {
        console.error('Sync failed for request:', req.id, error);
        // Leave in queue to try again later
      }
    }
    
    await updateQueueCount();
    setIsSyncing(false);
  };

  useEffect(() => {
    updateQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      processQueue(); // Auto sync when internet returns
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodically check queue if online
    const interval = setInterval(() => {
      if (navigator.onLine) processQueue();
      else updateQueueCount();
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline, isSyncing, pendingCount, processQueue }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);