import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tenantAPI } from '../../services/api';

// Async thunks
export const fetchTenants = createAsyncThunk(
  'tenants/fetchTenants',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tenantAPI.getAll();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch tenants');
    }
  }
);

export const createTenant = createAsyncThunk(
  'tenants/createTenant',
  async (tenantData, { rejectWithValue }) => {
    try {
      const response = await tenantAPI.create(tenantData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create tenant');
    }
  }
);

export const updateTenant = createAsyncThunk(
  'tenants/updateTenant',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await tenantAPI.update(id, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update tenant');
    }
  }
);

export const deleteTenant = createAsyncThunk(
  'tenants/deleteTenant',
  async (id, { rejectWithValue }) => {
    try {
      await tenantAPI.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete tenant');
    }
  }
);

const tenantSlice = createSlice({
  name: 'tenants',
  initialState: {
    items: [],
    loading: false,
    error: null,
    selectedTenant: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedTenant: (state, action) => {
      state.selectedTenant = action.payload;
    },
    clearSelectedTenant: (state) => {
      state.selectedTenant = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tenants
      .addCase(fetchTenants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTenants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create tenant
      .addCase(createTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTenant.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update tenant
      .addCase(updateTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTenant.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(tenant => tenant.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete tenant
      .addCase(deleteTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTenant.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(tenant => tenant.id !== action.payload);
      })
      .addCase(deleteTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setSelectedTenant, clearSelectedTenant } = tenantSlice.actions;
export default tenantSlice.reducer;
