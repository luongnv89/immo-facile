import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { receiptAPI } from '../../services/api';

// Async thunks
export const fetchReceipts = createAsyncThunk(
  'receipts/fetchReceipts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await receiptAPI.getAll();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch receipts');
    }
  }
);

export const fetchReceiptsByTenant = createAsyncThunk(
  'receipts/fetchReceiptsByTenant',
  async (tenantId, { rejectWithValue }) => {
    try {
      const response = await receiptAPI.getByTenant(tenantId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch tenant receipts');
    }
  }
);

export const generateReceipt = createAsyncThunk(
  'receipts/generateReceipt',
  async (receiptData, { rejectWithValue }) => {
    try {
      const response = await receiptAPI.generate(receiptData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to generate receipt');
    }
  }
);

export const downloadReceipt = createAsyncThunk(
  'receipts/downloadReceipt',
  async (id, { rejectWithValue }) => {
    try {
      const response = await receiptAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to download receipt');
    }
  }
);

export const sendReceiptEmail = createAsyncThunk(
  'receipts/sendReceiptEmail',
  async (id, { rejectWithValue }) => {
    try {
      const response = await receiptAPI.sendEmail(id);
      return { id, result: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to send receipt email');
    }
  }
);

export const deleteReceipt = createAsyncThunk(
  'receipts/deleteReceipt',
  async (id, { rejectWithValue }) => {
    try {
      await receiptAPI.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete receipt');
    }
  }
);

const receiptSlice = createSlice({
  name: 'receipts',
  initialState: {
    items: [],
    tenantReceipts: [],
    loading: false,
    error: null,
    generating: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTenantReceipts: (state) => {
      state.tenantReceipts = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all receipts
      .addCase(fetchReceipts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReceipts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchReceipts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch tenant receipts
      .addCase(fetchReceiptsByTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReceiptsByTenant.fulfilled, (state, action) => {
        state.loading = false;
        state.tenantReceipts = action.payload;
      })
      .addCase(fetchReceiptsByTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Generate receipt
      .addCase(generateReceipt.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(generateReceipt.fulfilled, (state, action) => {
        state.generating = false;
        state.items.push(action.payload);
        state.tenantReceipts.push(action.payload);
      })
      .addCase(generateReceipt.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload;
      })
      // Download receipt
      .addCase(downloadReceipt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadReceipt.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(downloadReceipt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete receipt
      .addCase(deleteReceipt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReceipt.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(receipt => receipt.id !== action.payload);
        state.tenantReceipts = state.tenantReceipts.filter(receipt => receipt.id !== action.payload);
      })
      .addCase(deleteReceipt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send receipt email
      .addCase(sendReceiptEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendReceiptEmail.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendReceiptEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearTenantReceipts } = receiptSlice.actions;
export default receiptSlice.reducer;
