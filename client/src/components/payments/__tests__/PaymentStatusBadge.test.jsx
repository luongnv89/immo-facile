/**
 * PaymentStatusBadge Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PaymentStatusBadge from '../PaymentStatusBadge';

describe('PaymentStatusBadge', () => {
  it('renders with default pending status', () => {
    render(<PaymentStatusBadge />);
    expect(screen.getByText('En attente')).toBeInTheDocument();
  });

  it('renders paid status correctly', () => {
    render(<PaymentStatusBadge status="paid" />);
    expect(screen.getByText('Payé')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Statut de paiement: Payé');
  });

  it('renders late status correctly', () => {
    render(<PaymentStatusBadge status="late" />);
    expect(screen.getByText('En retard')).toBeInTheDocument();
  });

  it('renders partial status correctly', () => {
    render(<PaymentStatusBadge status="partial" />);
    expect(screen.getByText('Partiel')).toBeInTheDocument();
  });

  it('renders without icon when showIcon is false', () => {
    const { container } = render(<PaymentStatusBadge status="paid" showIcon={false} />);
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBe(0);
  });

  it('renders with icon by default', () => {
    const { container } = render(<PaymentStatusBadge status="paid" />);
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('applies correct size classes', () => {
    const { rerender, container } = render(<PaymentStatusBadge size="sm" />);
    expect(container.firstChild).toHaveClass('text-xs');

    rerender(<PaymentStatusBadge size="md" />);
    expect(container.firstChild).toHaveClass('text-sm');

    rerender(<PaymentStatusBadge size="lg" />);
    expect(container.firstChild).toHaveClass('text-base');
  });

  it('handles invalid status gracefully', () => {
    render(<PaymentStatusBadge status="invalid" />);
    // Should default to pending
    expect(screen.getByText('En attente')).toBeInTheDocument();
  });
});
