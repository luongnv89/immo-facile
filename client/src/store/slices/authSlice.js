import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

const TOKEN_KEY = 'immofacile_token';

const loadStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const res = await authAPI.login(username, password);
      localStorage.setItem(TOKEN_KEY, res.data.token);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Échec de la connexion');
    }
  }
);

const initialState = {
  token: loadStoredToken(),
  user: null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {
        /* storage unavailable */
      }
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginUser.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Erreur de connexion';
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

export const selectIsAuthenticated = state => Boolean(state.auth.token);

export default authSlice.reducer;
