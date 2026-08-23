/**
 * RecordPaymentModal dismissal tests (#55):
 * - Escape and backdrop click close the modal
 * - a dirty form gates closing behind a confirmation dialog naming the loss
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecordPaymentModal from '../RecordPaymentModal';
import fr from '../../../i18n/fr';

const receipt = { firstName: 'Marie', lastName: 'Martin', month: 8, year: 2026, amount: 800 };

const setup = (overrides = {}) => {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    receipt,
    ...overrides,
  };
  render(<RecordPaymentModal {...props} />);
  return props;
};

beforeEach(() => {
  // jsdom lacks URL.createObjectURL/revokeObjectURL used elsewhere; harmless here
});

describe('RecordPaymentModal dismissal', () => {
  it('closes directly on Escape when the form is clean', () => {
    const { onClose } = setup();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });

  it('closes directly on backdrop click when the form is clean', () => {
    const { onClose } = setup();

    fireEvent.click(screen.getByTestId('modal-backdrop'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('gates Escape behind a dirty-form confirmation when notes were typed', () => {
    const { onClose } = setup();

    fireEvent.change(screen.getByLabelText(fr.modals.recordPayment.notes), {
      target: { value: 'Paiement partiel' },
    });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    expect(screen.getByText(fr.modals.dirtyConfirm.message)).toBeInTheDocument();
  });

  it('keeps the modal open when the dirty-form prompt is cancelled', () => {
    const { onClose } = setup();

    fireEvent.change(screen.getByLabelText(fr.modals.recordPayment.notes), {
      target: { value: 'Paiement partiel' },
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: fr.modals.dirtyConfirm.cancelLabel }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });

  it('closes after confirming the dirty-form prompt', () => {
    const { onClose } = setup();

    fireEvent.change(screen.getByLabelText(fr.modals.recordPayment.notes), {
      target: { value: 'Paiement partiel' },
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
