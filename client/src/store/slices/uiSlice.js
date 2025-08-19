import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    notifications: [],
    modals: {
      tenantForm: false,
      receiptGenerator: false,
      confirmDelete: false,
    },
    loading: {
      global: false,
    },
    theme: 'light',
  },
  reducers: {
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        type: 'info',
        duration: 5000,
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    openModal: (state, action) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modal => {
        state.modals[modal] = false;
      });
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
  },
});

export const {
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  closeAllModals,
  setGlobalLoading,
  toggleTheme,
} = uiSlice.actions;

export default uiSlice.reducer;
