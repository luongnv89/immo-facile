/**
 * Email service unit tests — Task 5.6 (#48).
 * The nodemailer transport is stubbed; content assembly, tracking records
 * and error paths are exercised against the real service singleton.
 */
const fs = require('fs');
const path = require('path');

describe('emailService', () => {
  let emailService;
  let sendMailMock;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const { initializeDatabase, closeDatabase } = require('../../database/db');
    await initializeDatabase();

    emailService = require('../../utils/emailService');
    // Stub the transport instead of configuring real credentials: keeps the
    // suite offline without leaking EMAIL_* env vars into other files.
    sendMailMock = jest.fn().mockResolvedValue({ messageId: '<test@example.com>' });
    emailService.transporter = { sendMail: sendMailMock };
  });

  afterAll(async () => {
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  const tenant = {
    firstName: 'Marie',
    lastName: 'Curie',
    gender: 'F',
    email: 'marie.curie@example.com',
  };
  const receiptData = { month: 6, year: 2026, amount: 820.5, charges: 40 };

  function makeTempPdf() {
    const dir = process.env.RECEIPTS_DIR || path.join(__dirname, '../../../receipts');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `email-service-test-${Date.now()}.pdf`);
    fs.writeFileSync(file, '%PDF-1.4 fake quittance for tests');
    return file;
  }

  describe('sendReceiptEmail', () => {
    it('sends a French quittance with attachment and tracking pixel', async () => {
      const pdfPath = makeTempPdf();
      const result = await emailService.sendReceiptEmail(tenant, receiptData, pdfPath, 'tok-123');

      expect(result.success).toBe(true);
      expect(result.recipient).toBe('marie.curie@example.com');
      expect(sendMailMock).toHaveBeenCalledTimes(1);

      const options = sendMailMock.mock.calls[0][0];
      expect(options.subject).toContain('Quittance de loyer - 6/2026');
      expect(options.to).toBe('marie.curie@example.com');
      expect(options.attachments[0].path).toBe(pdfPath);
      expect(options.html).toContain('Madame');
      expect(options.html).toContain('Charges');
      expect(options.text).toContain('Total payé');
      // tracking token renders the open-tracking pixel
      expect(options.html).toContain('/api/receipts/track/tok-123');

      fs.unlinkSync(pdfPath);
    });

    it('omits the tracking pixel when no token is provided', async () => {
      const pdfPath = makeTempPdf();
      await emailService.sendReceiptEmail(tenant, receiptData, pdfPath, null);
      const options = sendMailMock.mock.calls[sendMailMock.mock.calls.length - 1][0];
      expect(options.html).not.toContain('/api/receipts/track/');
      fs.unlinkSync(pdfPath);
    });

    it('throws when the transporter is not configured', async () => {
      const original = emailService.transporter;
      emailService.transporter = null;
      await expect(
        emailService.sendReceiptEmail(tenant, receiptData, '/tmp/x.pdf')
      ).rejects.toThrow(/not configured/i);
      emailService.transporter = original;
    });

    it('throws when the tenant has no email', async () => {
      await expect(
        emailService.sendReceiptEmail({ ...tenant, email: '' }, receiptData, '/tmp/x.pdf')
      ).rejects.toThrow(/tenant email/i);
    });

    it('throws when the receipt file is missing', async () => {
      await expect(
        emailService.sendReceiptEmail(tenant, receiptData, '/nonexistent/quittance.pdf')
      ).rejects.toThrow(/file not found/i);
    });

    it('wraps transport failures', async () => {
      const pdfPath = makeTempPdf();
      sendMailMock.mockRejectedValueOnce(new Error('SMTP down'));
      await expect(emailService.sendReceiptEmail(tenant, receiptData, pdfPath)).rejects.toThrow(
        /failed to send email/i
      );
      fs.unlinkSync(pdfPath);
    });
  });

  describe('sendPaymentReminder', () => {
    const receipt = { id: 1, month: 4, year: 2026, amount: 900, charges: 50 };

    it.each([
      [2, 'Rappel', 'normal'],
      [5, 'Important - Rappel', 'normal'],
      [10, 'URGENT - Rappel', 'high'],
    ])('escalates urgency for %i days overdue', async (days, prefix, priority) => {
      const result = await emailService.sendPaymentReminder(tenant, receipt, days);
      expect(result.success).toBe(true);
      expect(result.tracking_token).toBeTruthy();
      expect(result.daysOverdue).toBe(days);

      const options = sendMailMock.mock.calls[sendMailMock.mock.calls.length - 1][0];
      expect(options.subject.startsWith(prefix)).toBe(true);
      expect(options.priority).toBe(priority);
      expect(options.html).toMatch(/^<!DOCTYPE html>|<html|<div/i);
    });

    it('persists a reminder tracking record in the database', async () => {
      const EmailTracking = require('../../models/EmailTracking');
      await emailService.sendPaymentReminder(tenant, { ...receipt, id: 2 }, 3);
      const analytics = await EmailTracking.getAggregateAnalytics({
        emailType: 'reminder',
      });
      expect(Number(analytics.total_sent)).toBeGreaterThanOrEqual(2);
    });

    it('throws when unconfigured or missing recipient', async () => {
      const original = emailService.transporter;
      emailService.transporter = null;
      await expect(emailService.sendPaymentReminder(tenant, receipt, 3)).rejects.toThrow(
        /not configured/i
      );
      emailService.transporter = original;

      await expect(
        emailService.sendPaymentReminder({ ...tenant, email: undefined }, receipt, 3)
      ).rejects.toThrow(/tenant email/i);
    });

    it('wraps transport failures as payment-reminder errors', async () => {
      sendMailMock.mockRejectedValueOnce(new Error('relay refused'));
      await expect(emailService.sendPaymentReminder(tenant, receipt, 3)).rejects.toThrow(
        /failed to send payment reminder/i
      );
    });
  });
});
