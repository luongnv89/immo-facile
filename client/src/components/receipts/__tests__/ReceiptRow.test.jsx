/**
 * ReceiptRow Component Tests (Task 5.9)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReceiptRow from '../ReceiptRow';

const baseReceipt = {
  id: 7,
  firstName: 'Marie',
  lastName: 'Martin',
  month: 6,
  year: 2025,
  amount: 850,
  payment_status: 'pending',
  generated_at: '2025-07-01T09:00:00Z',
};

const setup = (receipt = baseReceipt) => {
  const handlers = {
    onView: vi.fn(),
    onRecordPayment: vi.fn(),
    onDownload: vi.fn(),
    onSendEmail: vi.fn(),
    onDelete: vi.fn(),
  };
  render(<ReceiptRow receipt={receipt} {...handlers} />);
  return handlers;
};

describe('ReceiptRow', () => {
  it('renders tenant identity, period and amount', () => {
    setup();

    expect(screen.getByText('Marie Martin')).toBeInTheDocument();
    expect(screen.getByText(/6\/2025 • €850/)).toBeInTheDocument();
  });

  it('renders the French label of the payment method', () => {
    setup({ ...baseReceipt, payment_method: 'bank_transfer' });

    expect(screen.getByText(/Virement/)).toBeInTheDocument();
  });

  it('falls back to Autre for unknown payment methods', () => {
    setup({ ...baseReceipt, payment_method: 'carrier_pigeon' });

    expect(screen.getByText(/Autre/)).toBeInTheDocument();
  });

  it('highlights long-overdue unpaid receipts with a day count', () => {
    // June 2025 rent was due 5 July 2025 — far in the past
    const { container } = render(<ReceiptRow receipt={baseReceipt} />);

    expect(container.firstChild.className).toContain('bg-red-50');
    expect(screen.getByText(/\d+j en retard/)).toBeInTheDocument();
  });

  it('does not highlight paid receipts as overdue', () => {
    const { container } = render(
      <ReceiptRow receipt={{ ...baseReceipt, payment_status: 'paid' }} />
    );

    expect(container.firstChild.className).not.toContain('bg-red-50');
    expect(screen.queryByText(/en retard/)).not.toBeInTheDocument();
  });

  it('shows email sent/opened and payment date markers', () => {
    setup({
      ...baseReceipt,
      payment_status: 'paid',
      email_sent: true,
      email_opened: true,
      payment_date: '2025-07-03T12:00:00Z',
    });

    expect(screen.getByText('Email envoyé')).toBeInTheDocument();
    expect(screen.getByText('Ouvert')).toBeInTheDocument();
    expect(screen.getByText(/Payé le/)).toBeInTheDocument();
  });

  it('offers the record-payment action for unpaid receipts', () => {
    setup(baseReceipt);

    expect(screen.getByRole('button', { name: 'Enregistrer le paiement' })).toBeInTheDocument();
  });

  it('hides the record-payment action for paid receipts', () => {
    setup({ ...baseReceipt, payment_status: 'paid' });

    expect(
      screen.queryByRole('button', { name: 'Enregistrer le paiement' })
    ).not.toBeInTheDocument();
  });

  it('disables the email action once the receipt has been sent', () => {
    setup({ ...baseReceipt, email_sent: true });

    const emailButton = screen.getByRole('button', { name: 'Email déjà envoyé' });
    expect(emailButton).toBeDisabled();
  });

  it('delegates every quick action to its handler with the receipt', () => {
    const handlers = setup(baseReceipt);

    fireEvent.click(screen.getByRole('button', { name: 'Voir la quittance' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le paiement' }));
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger la quittance' }));
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer par email' }));
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la quittance' }));

    expect(handlers.onView).toHaveBeenCalledWith(baseReceipt);
    expect(handlers.onRecordPayment).toHaveBeenCalledWith(baseReceipt);
    expect(handlers.onDownload).toHaveBeenCalledWith(baseReceipt);
    expect(handlers.onSendEmail).toHaveBeenCalledWith(baseReceipt);
    expect(handlers.onDelete).toHaveBeenCalledWith(baseReceipt);
  });
});
