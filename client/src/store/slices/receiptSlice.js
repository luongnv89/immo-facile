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

// Task 1.1.5: Payment Tracking Async Thunks

/**
 * Update payment status of a receipt
 */
export const updatePaymentStatus = createAsyncThunk(
  'receipts/updatePaymentStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await receiptAPI.updatePaymentStatus(id, status);
      return { id, status, data: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update payment status');
    }
  }
);

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

/**
 * Fetch receipts by payment status
 */
export const fetchReceiptsByPaymentStatus = createAsyncThunk(
  'receipts/fetchReceiptsByPaymentStatus',
  async (status, { rejectWithValue }) => {
    try {
      const response = await receiptAPI.getByPaymentStatus(status);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch receipts by status');
    }
  }
);

/**
 * Fetch payment history for a receipt
 */
export const fetchPaymentHistory = createAsyncThunk(
  'receipts/fetchPaymentHistory',
  async (id, { rejectWithValue }) => {
    try {
      const response = await receiptAPI.getPaymentHistory(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch payment history');
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
    // Task 1.1.5: Payment tracking state
    updatingPayment: false,
    paymentHistory: null,
  },
  reducers: {
    clearError: state => {
      state.error = null;
    },
    clearTenantReceipts: state => {
      state.tenantReceipts = [];
    },
    // Task 1.1.5: Optimistic update for payment status
    optimisticUpdatePaymentStatus: (state, action) => {
      const { id, status } = action.payload;
      const receipt = state.items.find(r => r.id === id);
      if (receipt) {
        receipt.payment_status = status;
      }
      const tenantReceipt = state.tenantReceipts.find(r => r.id === id);
      if (tenantReceipt) {
        tenantReceipt.payment_status = status;
      }
    },
    // Task 1.1.5: Rollback optimistic update on error
    rollbackPaymentStatus: (state, action) => {
      const { id, previousStatus } = action.payload;
      const receipt = state.items.find(r => r.id === id);
      if (receipt) {
        receipt.payment_status = previousStatus;
      }
      const tenantReceipt = state.tenantReceipts.find(r => r.id === id);
      if (tenantReceipt) {
        tenantReceipt.payment_status = previousStatus;
      }
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
      // Fetch tenant receipts
      .addCase(fetchReceiptsByTenant.pending, state => {
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
      .addCase(generateReceipt.pending, state => {
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
        state.tenantReceipts = state.tenantReceipts.filter(
          receipt => receipt.id !== action.payload
        );
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
        // Update email_sent status in tenantReceipts array
        const tenantReceipt = state.tenantReceipts.find(r => r.id === id);
        if (tenantReceipt) {
          tenantReceipt.email_sent = true;
        }
      })
      .addCase(sendReceiptEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Task 1.1.5: Update payment status
      .addCase(updatePaymentStatus.pending, state => {
        state.updatingPayment = true;
        state.error = null;
      })
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        state.updatingPayment = false;
        const { id, status } = action.payload;
        // Update in items array
        const receipt = state.items.find(r => r.id === id);
        if (receipt) {
          receipt.payment_status = status;
        }
        // Update in tenantReceipts array
        const tenantReceipt = state.tenantReceipts.find(r => r.id === id);
        if (tenantReceipt) {
          tenantReceipt.payment_status = status;
        }
      })
      .addCase(updatePaymentStatus.rejected, (state, action) => {
        state.updatingPayment = false;
        state.error = action.payload;
      })
      // Task 1.1.5: Record payment
      .addCase(recordPayment.pending, state => {
        state.updatingPayment = true;
        state.error = null;
      })
      .addCase(recordPayment.fulfilled, (state, action) => {
        state.updatingPayment = false;
        const { id, paymentData } = action.payload;
        // Update in items array
        const receipt = state.items.find(r => r.id === id);
        if (receipt) {
          receipt.payment_status = 'paid';
          receipt.payment_date = paymentData.payment_date;
          receipt.payment_method = paymentData.payment_method;
          receipt.notes = paymentData.notes;
        }
        // Update in tenantReceipts array
        const tenantReceipt = state.tenantReceipts.find(r => r.id === id);
        if (tenantReceipt) {
          tenantReceipt.payment_status = 'paid';
          tenantReceipt.payment_date = paymentData.payment_date;
          tenantReceipt.payment_method = paymentData.payment_method;
          tenantReceipt.notes = paymentData.notes;
        }
      })
      .addCase(recordPayment.rejected, (state, action) => {
        state.updatingPayment = false;
        state.error = action.payload;
      })
      // Task 1.1.5: Fetch receipts by payment status
      .addCase(fetchReceiptsByPaymentStatus.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReceiptsByPaymentStatus.fulfilled, state => {
        state.loading = false;
        // Optionally store filtered results separately
        // For now, we just acknowledge the fetch completed
      })
      .addCase(fetchReceiptsByPaymentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Task 1.1.5: Fetch payment history
      .addCase(fetchPaymentHistory.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentHistory = action.payload;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearTenantReceipts,
  optimisticUpdatePaymentStatus,
  rollbackPaymentStatus,
} = receiptSlice.actions;

// Task 1.1.5: Selectors for payment tracking
export const selectReceiptsByPaymentStatus = (state, status) => {
  return state.receipts.items.filter(receipt => (receipt.payment_status || 'pending') === status);
};

export const selectPendingReceipts = state => {
  return selectReceiptsByPaymentStatus(state, 'pending');
};

export const selectPaidReceipts = state => {
  return selectReceiptsByPaymentStatus(state, 'paid');
};

export const selectLateReceipts = state => {
  return selectReceiptsByPaymentStatus(state, 'late');
};

export const selectTotalPendingAmount = state => {
  return state.receipts.items
    .filter(r => (r.payment_status || 'pending') !== 'paid')
    .reduce((sum, r) => sum + (r.amount || 0), 0);
};

export const selectTotalPaidAmount = state => {
  return state.receipts.items
    .filter(r => r.payment_status === 'paid')
    .reduce((sum, r) => sum + (r.amount || 0), 0);
};

export default receiptSlice.reducer;
