import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchOwner = createAsyncThunk('owner/fetchOwner', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/owner');
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const updateOwner = createAsyncThunk(
  'owner/updateOwner',
  async (ownerData, { rejectWithValue }) => {
    try {
      const response = await api.put('/owner', ownerData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createOwner = createAsyncThunk(
  'owner/createOwner',
  async (ownerData, { rejectWithValue }) => {
    try {
      const response = await api.post('/owner', ownerData);
      return response.data.data;
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

      const response = await api.post('/owner/signature', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSignatureImage = createAsyncThunk(
  'owner/fetchSignatureImage',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/owner/signature');
      return response.data.data;
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
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch owner
      .addCase(fetchOwner.pending, state => {
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
      .addCase(updateOwner.pending, state => {
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
      .addCase(createOwner.pending, state => {
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
      .addCase(uploadSignature.pending, state => {
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
      .addCase(fetchSignatureImage.pending, state => {
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
