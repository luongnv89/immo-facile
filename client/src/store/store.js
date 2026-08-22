import { configureStore } from '@reduxjs/toolkit';
import tenantReducer from './slices/tenantSlice';
import receiptReducer from './slices/receiptSlice';
import uiReducer from './slices/uiSlice';
import apartmentReducer from './slices/apartmentSlice';
import ownerReducer from './slices/ownerSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    tenants: tenantReducer,
    receipts: receiptReducer,
    ui: uiReducer,
    apartments: apartmentReducer,
    owner: ownerReducer,
    auth: authReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});
