/**
 * Receipt service unit tests — Task 5.8 (#50).
 * The service owns generation orchestration; models, PDF generator
 * and email transport are mocked to isolate the business flow.
 */
jest.mock('../../models/Receipt');
jest.mock('../../models/Tenant');
jest.mock('../../utils/pdfGenerator');
jest.mock('../../utils/emailService');

const Receipt = require('../../models/Receipt');
const Tenant = require('../../models/Tenant');
const PDFGenerator = require('../../utils/pdfGenerator');
const emailService = require('../../utils/emailService');
const receiptService = require('../receiptService');
const { NotFoundError, ConflictError } = require('../../utils/errors');

const TENANT = {
  id: 7,
  firstName: 'Jean',
  lastName: 'Dupont',
  gender: 'M',
  email: 'jean@example.com',
};

const INPUT = {
  tenantId: 7,
  month: 6,
  year: 2026,
  amount: 700,
  charges: 50,
  paymentDate: '2026-07-03',
};

describe('receiptService.createReceipt (#50)', () => {
  beforeEach(() => {
    Tenant.findById.mockResolvedValue({ ...TENANT });
    Receipt.checkExists.mockResolvedValue(null);
    PDFGenerator.generateReceipt.mockResolvedValue({
      fileName: '2026_06_quittance_de_loyer_DUPONT_Jean.pdf',
      filePath: '/tmp/receipts/2026_06_quittance_de_loyer_DUPONT_Jean.pdf',
    });
    Receipt.create.mockResolvedValue({
      id: 1,
      tracking_token: 'tok-123',
      tenant_id: TENANT.id,
      month: INPUT.month,
      year: INPUT.year,
    });
  });

  it('generates the PDF and persists a receipt without emailing', async () => {
    const result = await receiptService.createReceipt({ ...INPUT });

    expect(Tenant.findById).toHaveBeenCalledWith(7);
    expect(Receipt.checkExists).toHaveBeenCalledWith(7, 6, 2026);
    expect(PDFGenerator.generateReceipt).toHaveBeenCalledTimes(1);
    expect(Receipt.create).toHaveBeenCalledWith({
      tenant_id: 7,
      month: 6,
      year: 2026,
      amount: 700,
      fileName: '2026_06_quittance_de_loyer_DUPONT_Jean.pdf',
      filePath: '/tmp/receipts/2026_06_quittance_de_loyer_DUPONT_Jean.pdf',
    });
    expect(result.receipt).toMatchObject({ id: 1 });
    expect(result.message).toBe('Receipt generated successfully');
    expect(result.emailResult).toBeNull();
    expect(emailService.sendReceiptEmail).not.toHaveBeenCalled();
    expect(Receipt.updateEmailStatus).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the tenant does not exist', async () => {
    Tenant.findById.mockResolvedValue(null);

    await expect(receiptService.createReceipt({ ...INPUT })).rejects.toThrow(NotFoundError);
    expect(PDFGenerator.generateReceipt).not.toHaveBeenCalled();
    expect(Receipt.create).not.toHaveBeenCalled();
  });

  it('throws ConflictError when a receipt already exists for the period', async () => {
    Receipt.checkExists.mockResolvedValue({ id: 99 });

    await expect(receiptService.createReceipt({ ...INPUT })).rejects.toThrow(ConflictError);
    expect(PDFGenerator.generateReceipt).not.toHaveBeenCalled();
    expect(Receipt.create).not.toHaveBeenCalled();
  });

  it('maps the UNIQUE(tenant_id, month, year) race to ConflictError', async () => {
    Receipt.create.mockRejectedValue(new Error('UNIQUE constraint failed: receipts.tenant_id'));

    await expect(receiptService.createReceipt({ ...INPUT })).rejects.toThrow(
      new ConflictError('Receipt already exists for this period')
    );
  });

  it('rethrows non-UNIQUE persistence errors untouched', async () => {
    Receipt.create.mockRejectedValue(new Error('disk on fire'));

    await expect(receiptService.createReceipt({ ...INPUT })).rejects.toThrow('disk on fire');
  });

  describe('email delivery', () => {
    beforeEach(() => {
      emailService.sendReceiptEmail.mockResolvedValue({ success: true, messageId: '<x@y>' });
      INPUT.sendEmail = true;
    });

    afterEach(() => {
      delete INPUT.sendEmail;
    });

    it('sends the receipt with the tracking token and flags email_sent', async () => {
      const result = await receiptService.createReceipt({ ...INPUT });

      expect(emailService.sendReceiptEmail).toHaveBeenCalledWith(
        expect.objectContaining({ id: TENANT.id }),
        expect.objectContaining({ month: 6, year: 2026 }),
        '/tmp/receipts/2026_06_quittance_de_loyer_DUPONT_Jean.pdf',
        'tok-123'
      );
      expect(Receipt.updateEmailStatus).toHaveBeenCalledWith(1, true);
      expect(result.message).toBe('Receipt generated and sent via email successfully');
      expect(result.emailResult).toEqual({ success: true, messageId: '<x@y>' });
    });

    it('reports failure without failing the operation when sending throws', async () => {
      emailService.sendReceiptEmail.mockRejectedValue(new Error('SMTP down'));

      const result = await receiptService.createReceipt({ ...INPUT });

      expect(result.message).toBe('Receipt generated successfully, but email sending failed');
      expect(result.emailResult).toEqual({ success: false, error: 'SMTP down' });
    });

    it('reports a missing tenant address instead of attempting delivery', async () => {
      Tenant.findById.mockResolvedValue({ ...TENANT, email: null });

      const result = await receiptService.createReceipt({ ...INPUT });

      expect(emailService.sendReceiptEmail).not.toHaveBeenCalled();
      expect(Receipt.updateEmailStatus).not.toHaveBeenCalled();
      expect(result.message).toBe(
        'Receipt generated successfully, but no email address found for tenant'
      );
      expect(result.emailResult).toEqual({
        success: false,
        error: 'No email address found for tenant',
      });
    });
  });
});

describe('receiptService.buildReceiptData (#50)', () => {
  it('defaults paymentDate to today (ISO date) when absent', () => {
    const data = receiptService.buildReceiptData({ month: 6, year: 2026, amount: 700 });

    expect(data.paymentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data).toMatchObject({ month: 6, year: 2026, amount: 700, charges: undefined });
  });

  it('passes an explicit paymentDate through unchanged', () => {
    const data = receiptService.buildReceiptData({
      month: 6,
      year: 2026,
      amount: 700,
      charges: 25,
      paymentDate: '2026-06-30',
    });

    expect(data.paymentDate).toBe('2026-06-30');
  });
});
