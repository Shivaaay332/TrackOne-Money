import axios from 'axios';
import { saveToCache, getFromCache, addToQueue } from '../utils/db';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) config.headers.Authorization = `Bearer ${user.token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: The Offline-First Engine
api.interceptors.response.use(
  (response) => {
    // If it's a GET request, save the fresh data to IndexedDB for offline use
    if (response.config.method === 'get') {
      saveToCache(response.config.url, response.data);
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    
    // Check if the error is due to being offline or a network failure
    if (!navigator.onLine || error.code === 'ERR_NETWORK') {
      
      // If user was trying to FETCH data (GET), return the cached offline data
      if (config.method === 'get') {
        const cachedData = await getFromCache(config.url);
        if (cachedData) {
          console.log(`[Offline Mode] Served ${config.url} from IndexedDB Cache`);
          return Promise.resolve({ data: cachedData });
        }
        return Promise.reject(new Error("You are offline and no cached data is available."));
      } 
      
      // If user was trying to SAVE data (POST/PUT/DELETE), add it to the Offline Queue
      else {
        console.log(`[Offline Mode] Queued ${config.method.toUpperCase()} request to ${config.url}`);
        
        let parsedData = {};
        if (config.data) {
          // Handle FormData (Profile photos/receipts) gracefully by converting to generic object for queue
          if (config.data instanceof FormData) {
             config.data.forEach((value, key) => parsedData[key] = value);
          } else {
             parsedData = JSON.parse(config.data);
          }
        }

        await addToQueue({
          url: config.url,
          method: config.method,
          data: parsedData,
          headers: config.headers
        });

        // Resolve the promise so the UI (Modals, Forms) think it succeeded and close normally
        return Promise.resolve({ 
          data: { success: true, message: 'Saved offline. Will sync automatically.', data: parsedData } 
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;