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

// Task 1.1.5: Payment Tracking Async Thunk

/**
 * Record payment for a receipt
 */
export const recordPayment = createAsyncThunk(
  'receipts/recordPayment',
  async ({ id, paymentData }, { rejectWithValue }) => {
    try {
      const response = await receiptAPI.recordPayment(id, paymentData);
      return { id, paymentData: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to record payment');
    }
  }
);

const receiptSlice = createSlice({
  name: 'receipts',
  initialState: {
    items: [],
    loading: false,
    error: null,
    generating: false,
  },
  reducers: {
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch all receipts
      .addCase(fetchReceipts.pending, state => {
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
      // Generate receipt
      .addCase(generateReceipt.pending, state => {
        state.generating = true;
        state.error = null;
      })
      .addCase(generateReceipt.fulfilled, (state, action) => {
        state.generating = false;
        const receipt = action.payload?.data ?? action.payload;
        if (!receipt || !receipt.id) return;
        state.items.push(receipt);
      })
      .addCase(generateReceipt.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload;
      })
      // Download receipt
      .addCase(downloadReceipt.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadReceipt.fulfilled, state => {
        state.loading = false;
      })
      .addCase(downloadReceipt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete receipt
      .addCase(deleteReceipt.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReceipt.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(receipt => receipt.id !== action.payload);
      })
      .addCase(deleteReceipt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send receipt email
      .addCase(sendReceiptEmail.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendReceiptEmail.fulfilled, (state, action) => {
        state.loading = false;
        const { id } = action.payload;
        // Update email_sent status in items array
        const receipt = state.items.find(r => r.id === id);
        if (receipt) {
          receipt.email_sent = true;
        }
      })
      .addCase(sendReceiptEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Task 1.1.5: Record payment
      .addCase(recordPayment.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recordPayment.fulfilled, (state, action) => {
        state.loading = false;
        const { id, paymentData } = action.payload;
        const receipt = state.items.find(r => r.id === id);
        if (receipt) {
          receipt.payment_status = 'paid';
          receipt.payment_date = paymentData.payment_date;
          receipt.payment_method = paymentData.payment_method;
          receipt.notes = paymentData.notes;
        }
      })
      .addCase(recordPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = receiptSlice.actions;

export default receiptSlice.reducer;
