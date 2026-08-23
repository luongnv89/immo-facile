import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('../../../services/api', () => ({
  receiptAPI: {
    getAll: vi.fn(),
    generate: vi.fn(),
    download: vi.fn(),
    sendEmail: vi.fn(),
    delete: vi.fn(),
    recordPayment: vi.fn(),
  },
}));

const { receiptAPI } = await import('../../../services/api');
const mod = await import('../receiptSlice');
const {
  default: reducer,
  fetchReceipts,
  generateReceipt,
  downloadReceipt,
  sendReceiptEmail,
  deleteReceipt,
  recordPayment,
  clearError,
} = mod;

const makeStore = () => configureStore({ reducer: { receipts: reducer } });
const receipt = {
  id: 1,
  month: 6,
  year: 2026,
  amount: 820,
  payment_status: 'pending',
};

describe('receiptSlice thunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('URL', {
      ...window.URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/abc'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('fetchReceipts stores the list and reports failures in French-free fallback', async () => {
    receiptAPI.getAll.mockResolvedValueOnce({ data: { data: [receipt] } });
    const store = makeStore();

    await store.dispatch(fetchReceipts());
    expect(store.getState().receipts.items).toEqual([receipt]);

    receiptAPI.getAll.mockRejectedValueOnce({ response: { data: { error: 'Non autorisé' } } });
    await store.dispatch(fetchReceipts());
    expect(store.getState().receipts.error).toBe('Non autorisé');
  });

  it('generateReceipt appends valid payloads and skips malformed ones', async () => {
    const store = makeStore();

    receiptAPI.generate.mockResolvedValueOnce({ data: { data: receipt } });
    await store.dispatch(generateReceipt({ month: 6 }));
    expect(store.getState().receipts.items).toHaveLength(1);
    expect(store.getState().receipts.generating).toBe(false);

    receiptAPI.generate.mockResolvedValueOnce({ data: { data: { nope: true } } });
    await store.dispatch(generateReceipt({ month: 7 }));
    expect(store.getState().receipts.items).toHaveLength(1);

    receiptAPI.generate.mockResolvedValueOnce({ data: {} });
    await store.dispatch(generateReceipt({ month: 8 }));
    expect(store.getState().receipts.items).toHaveLength(1);

    receiptAPI.generate.mockRejectedValueOnce({
      response: { data: { error: 'VALIDATION_ERROR' } },
    });
    await store.dispatch(generateReceipt({}));
    expect(store.getState().receipts.error).toBe('VALIDATION_ERROR');
    expect(store.getState().receipts.generating).toBe(false);
  });

  it('downloadReceipt drives the browser download flow', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    receiptAPI.download.mockResolvedValueOnce({ data: new Blob(['%PDF-']) });
    const store = makeStore();

    const result = await store.dispatch(downloadReceipt(7));
    expect(result.payload).toBe(7);
    expect(receiptAPI.download).toHaveBeenCalledWith(7);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(appendSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/abc');
    expect(store.getState().receipts.loading).toBe(false);

    clickSpy.mockRestore();
    appendSpy.mockRestore();
  });

  it('downloadReceipt surfaces failures', async () => {
    receiptAPI.download.mockRejectedValueOnce(new Error('404'));
    const store = makeStore();

    await store.dispatch(downloadReceipt(999));
    expect(store.getState().receipts.error).toBe('Failed to download receipt');
  });

  it('sendReceiptEmail flags email_sent on the matching receipt', async () => {
    receiptAPI.getAll.mockResolvedValue({ data: { data: [receipt] } });
    receiptAPI.sendEmail.mockResolvedValueOnce({ data: { success: true } });
    const store = makeStore();
    await store.dispatch(fetchReceipts());

    await store.dispatch(sendReceiptEmail(1));
    expect(store.getState().receipts.items[0].email_sent).toBe(true);
    expect(store.getState().receipts.loading).toBe(false);

    receiptAPI.sendEmail.mockRejectedValueOnce({ response: { data: { error: 'SMTP down' } } });
    await store.dispatch(sendReceiptEmail(1));
    expect(store.getState().receipts.error).toBe('SMTP down');
  });

  it('deleteReceipt removes only the targeted id', async () => {
    receiptAPI.getAll.mockResolvedValue({
      data: { data: [receipt, { ...receipt, id: 2 }] },
    });
    receiptAPI.delete.mockResolvedValueOnce({});
    const store = makeStore();
    await store.dispatch(fetchReceipts());

    await store.dispatch(deleteReceipt(1));
    expect(store.getState().receipts.items.map(r => r.id)).toEqual([2]);

    receiptAPI.delete.mockRejectedValueOnce({ response: { data: { error: 'Conflict' } } });
    await store.dispatch(deleteReceipt(2));
    expect(store.getState().receipts.error).toBe('Conflict');
  });

  it('recordPayment patches payment fields onto the receipt', async () => {
    const paymentData = {
      payment_date: '2026-07-02',
      payment_method: 'bank_transfer',
      notes: 'Virement',
    };
    receiptAPI.getAll.mockResolvedValue({ data: { data: [{ ...receipt }] } });
    receiptAPI.recordPayment.mockResolvedValueOnce({ data: { data: paymentData } });
    const store = makeStore();
    await store.dispatch(fetchReceipts());

    await store.dispatch(recordPayment({ id: 1, paymentData }));
    const updated = store.getState().receipts.items[0];
    expect(updated.payment_status).toBe('paid');
    expect(updated.payment_date).toBe('2026-07-02');
    expect(updated.payment_method).toBe('bank_transfer');
    expect(updated.notes).toBe('Virement');

    receiptAPI.recordPayment.mockRejectedValueOnce({ response: { data: { error: 'Bad method' } } });
    await store.dispatch(recordPayment({ id: 1, paymentData: {} }));
    expect(store.getState().receipts.error).toBe('Bad method');
  });
});

describe('receiptSlice sync reducers', () => {
  it('clearError resets the error field', () => {
    let state = { ...reducer(undefined, { type: '@@INIT' }), error: 'x' };
    state = reducer(state, clearError());
    expect(state.error).toBeNull();
  });
});
