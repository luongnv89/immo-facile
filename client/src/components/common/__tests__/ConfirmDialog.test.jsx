/**
 * ConfirmDialog tests (#55): in-app confirmation replacing window.confirm —
 * Escape and backdrop dismiss, confirm triggers the action, message content.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../ConfirmDialog';
import fr from '../../../i18n/fr';

const setup = (overrides = {}) => {
  const props = {
    isOpen: true,
    title: 'Supprimer le locataire',
    message: 'Supprimer « Jean Dupont » ? Cette action est définitive.',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<ConfirmDialog {...props} />);
  return props;
};

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="T"
        message="M"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });

  it('shows the title and a message naming object and consequence', () => {
    setup();

    expect(screen.getByText('Supprimer le locataire')).toBeInTheDocument();
    expect(screen.getByText(/« Jean Dupont »/)).toBeInTheDocument();
    expect(screen.getByText(/définitive/)).toBeInTheDocument();
  });

  it('closes on Escape via onCancel', () => {
    const { onCancel, onConfirm } = setup();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('closes on backdrop click via onCancel', () => {
    const { onCancel } = setup();

    fireEvent.click(screen.getByTestId('confirm-dialog-backdrop'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('runs onConfirm when the action button is clicked', () => {
    const { onConfirm } = setup({ confirmLabel: fr.common.delete });

    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
