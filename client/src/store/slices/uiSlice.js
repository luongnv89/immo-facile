import { createSlice } from '@reduxjs/toolkit';

// Monotonic ids — Date.now() collides when two
// notifications are created in the same millisecond.
let nextNotificationId = 1;

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    notifications: [],
  },
  reducers: {
    addNotification: (state, action) => {
      const notification = {
        type: 'info',
        duration: 5000,
        ...action.payload,
        id: nextNotificationId++,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
  },
});

export const { addNotification, removeNotification } = uiSlice.actions;

export default uiSlice.reducer;
