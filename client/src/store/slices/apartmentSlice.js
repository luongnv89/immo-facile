import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchApartments = createAsyncThunk(
  'apartments/fetchApartments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/apartments');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createApartment = createAsyncThunk(
  'apartments/createApartment',
  async (apartmentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/apartments', apartmentData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateApartment = createAsyncThunk(
  'apartments/updateApartment',
  async ({ id, data: apartmentData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/apartments/${id}`, apartmentData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteApartment = createAsyncThunk(
  'apartments/deleteApartment',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/apartments/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const apartmentSlice = createSlice({
  name: 'apartments',
  initialState: {
    items: [],
    selectedApartment: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setSelectedApartment: (state, action) => {
      state.selectedApartment = action.payload;
    },
    clearSelectedApartment: state => {
      state.selectedApartment = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch apartments
      .addCase(fetchApartments.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApartments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchApartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create apartment
      .addCase(createApartment.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createApartment.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createApartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update apartment
      .addCase(updateApartment.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateApartment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.selectedApartment = null;
      })
      .addCase(updateApartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete apartment
      .addCase(deleteApartment.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteApartment.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(deleteApartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setSelectedApartment, clearSelectedApartment } = apartmentSlice.actions;
export default apartmentSlice.reducer;
