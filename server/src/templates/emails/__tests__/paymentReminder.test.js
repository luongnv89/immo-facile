/**
 * Payment Reminder Email Template Tests
 */

const { generatePaymentReminderHTML, generatePaymentReminderText } = require('../paymentReminder');

describe('Payment Reminder Email Templates', () => {
  const mockData = {
    tenant: {
      firstName: 'Jean',
      lastName: 'Dupont',
      gender: 'M',
      email: 'jean.dupont@example.com',
    },
    receipt: {
      id: 1,
      month: 10,
      year: 2025,
      amount: 850.0,
    },
    daysOverdue: 5,
    trackingToken: 'test-token-123',
    serverUrl: 'http://localhost:5001',
  };

  describe('generatePaymentReminderHTML', () => {
    it('should generate valid HTML email', () => {
      const html = generatePaymentReminderHTML(mockData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('ImmoFacile');
      expect(html).toContain('Monsieur <strong>Dupont</strong>');
      expect(html).toContain('850.00 €');
      expect(html).toContain('5 jours');
    });

    it('should include tracking pixel when token provided', () => {
      const html = generatePaymentReminderHTML(mockData);

      expect(html).toContain('test-token-123');
      expect(html).toContain('/api/receipts/track/');
    });

    it('should not include tracking pixel when token is null', () => {
      const dataWithoutToken = { ...mockData, trackingToken: null };
      const html = generatePaymentReminderHTML(dataWithoutToken);

      expect(html).not.toContain('/api/receipts/track/');
    });

    it('should show correct urgency for low overdue (<=3 days)', () => {
      const lowOverdueData = { ...mockData, daysOverdue: 2 };
      const html = generatePaymentReminderHTML(lowOverdueData);

      expect(html).toContain('Rappel amical');
    });

    it('should show correct urgency for medium overdue (4-7 days)', () => {
      const mediumOverdueData = { ...mockData, daysOverdue: 5 };
      const html = generatePaymentReminderHTML(mediumOverdueData);

      expect(html).toContain('Rappel important');
    });

    it('should show correct urgency for high overdue (>7 days)', () => {
      const highOverdueData = { ...mockData, daysOverdue: 10 };
      const html = generatePaymentReminderHTML(highOverdueData);

      expect(html).toContain('Rappel urgent');
    });

    it('should use correct gender salutation for female', () => {
      const femaleData = {
        ...mockData,
        tenant: { ...mockData.tenant, gender: 'F' },
      };
      const html = generatePaymentReminderHTML(femaleData);

      expect(html).toContain('Madame <strong>Dupont</strong>');
    });

    it('should be responsive with proper meta tags', () => {
      const html = generatePaymentReminderHTML(mockData);

      expect(html).toContain('viewport');
      expect(html).toContain('width=device-width');
    });
  });

  describe('generatePaymentReminderText', () => {
    it('should generate valid plain text email', () => {
      const text = generatePaymentReminderText(mockData);

      expect(text).toContain('ImmoFacile');
      expect(text).toContain('Monsieur Dupont');
      expect(text).toContain('850.00 €');
      expect(text).toContain('5 jours');
    });

    it('should not contain HTML tags', () => {
      const text = generatePaymentReminderText(mockData);

      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
    });

    it('should format correctly for different urgency levels', () => {
      const lowOverdueData = { ...mockData, daysOverdue: 2 };
      const text = generatePaymentReminderText(lowOverdueData);

      expect(text).toContain('Rappel amical');
    });
  });
});
