/**
 * ViewReceiptModal dismissal tests (#55): Escape and backdrop click close
 * the viewer; the retry path is reachable when the PDF fails to load.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ViewReceiptModal from '../ViewReceiptModal';
import { receiptAPI } from '../../services/api';
import fr from '../../i18n/fr';

vi.mock('../../services/api', () => ({
  receiptAPI: {
    download: vi.fn(),
  },
}));

const receipt = {
  id: 7,
  firstName: 'Marie',
  lastName: 'Martin',
  month: 8,
  year: 2026,
  amount: 800,
  generated_at: '2026-08-01T09:00:00Z',
};

const setup = (overrides = {}) => {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    receipt,
    ...overrides,
  };
  render(<ViewReceiptModal {...props} />);
  return props;
};

beforeEach(() => {
  receiptAPI.download.mockReset();
  window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  window.URL.revokeObjectURL = vi.fn();
});

describe('ViewReceiptModal dismissal', () => {
  it('closes on Escape', async () => {
    receiptAPI.download.mockResolvedValue({ data: new ArrayBuffer(8) });
    const { onClose } = setup();

    await waitFor(() => expect(screen.getByTitle(/Quittance de Loyer/)).toBeInTheDocument());

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click', async () => {
    receiptAPI.download.mockResolvedValue({ data: new ArrayBuffer(8) });
    const { onClose } = setup();

    await waitFor(() => expect(screen.getByTitle(/Quittance de Loyer/)).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('modal-backdrop'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an error state with retry when the PDF fails to load', async () => {
    receiptAPI.download.mockRejectedValue(new Error('boom'));
    setup();

    expect(await screen.findByText(fr.modals.viewReceipt.loadError)).toBeInTheDocument();

    // Retry re-triggers the download
    fireEvent.click(screen.getByRole('button', { name: fr.modals.viewReceipt.retry }));
    expect(receiptAPI.download).toHaveBeenCalledTimes(2);
  });
});
