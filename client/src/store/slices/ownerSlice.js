import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

// Async thunks
export const fetchOwner = createAsyncThunk(
  'owner/fetchOwner',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/owner`);
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch owner');
      }
      
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateOwner = createAsyncThunk(
  'owner/updateOwner',
  async (ownerData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/owner`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ownerData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to update owner');
      }
      
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createOwner = createAsyncThunk(
  'owner/createOwner',
  async (ownerData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ownerData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to create owner');
      }
      
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadSignature = createAsyncThunk(
  'owner/uploadSignature',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('signature', file);
      
      const response = await fetch(`${API_BASE_URL}/owner/signature`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to upload signature');
      }
      
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSignatureImage = createAsyncThunk(
  'owner/fetchSignatureImage',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/owner/signature`);
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch signature image');
      }
      
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const ownerSlice = createSlice({
  name: 'owner',
  initialState: {
    data: null,
    loading: false,
    error: null,
    signatureImage: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch owner
      .addCase(fetchOwner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwner.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchOwner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update owner
      .addCase(updateOwner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOwner.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(updateOwner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create owner
      .addCase(createOwner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOwner.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(createOwner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Upload signature
      .addCase(uploadSignature.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadSignature.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(uploadSignature.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch signature image
      .addCase(fetchSignatureImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSignatureImage.fulfilled, (state, action) => {
        state.loading = false;
        state.signatureImage = action.payload;
      })
      .addCase(fetchSignatureImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = ownerSlice.actions;
export default ownerSlice.reducer;
