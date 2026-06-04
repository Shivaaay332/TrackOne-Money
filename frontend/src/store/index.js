import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Note: Future slices (expenses, incomes, etc.) can be added here if needed,
    // though for performance, fetching directly via custom hooks/React Query is also standard.
    // We will manage UI state here.
  },
});