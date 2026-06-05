import { openDB } from 'idb';

const DB_NAME = 'TrackOneOfflineDB';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for caching GET requests (Dashboards, lists, etc.)
      if (!db.objectStoreNames.contains('apiCache')) {
        db.createObjectStore('apiCache', { keyPath: 'url' });
      }
      // Store for queuing POST/PUT/DELETE requests
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

// --- Caching Engine ---
export const saveToCache = async (url, data) => {
  const db = await initDB();
  await db.put('apiCache', { url, data, timestamp: Date.now() });
};

export const getFromCache = async (url) => {
  const db = await initDB();
  const cached = await db.get('apiCache', url);
  return cached ? cached.data : null;
};

// --- Sync Queue Engine ---
export const addToQueue = async (request) => {
  const db = await initDB();
  await db.add('syncQueue', { ...request, timestamp: Date.now() });
};

export const getQueue = async () => {
  const db = await initDB();
  return await db.getAll('syncQueue');
};

export const removeFromQueue = async (id) => {
  const db = await initDB();
  await db.delete('syncQueue', id);
};

export const clearQueue = async () => {
  const db = await initDB();
  await db.clear('syncQueue');
};