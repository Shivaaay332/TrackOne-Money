import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  // Adding middleware to avoid serializable check warnings if any
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// YAHI LINE MISSING THI JISKI WAJAH SE ERROR AAYA:
export default store;