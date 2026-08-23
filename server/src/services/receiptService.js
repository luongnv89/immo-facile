/**
 * Receipt Service — Task 5.8 (#50)
 *
 * Owns the receipt-generation orchestration:
 * - tenant existence + duplicate-period guards
 * - quittance PDF generation (utils/pdfGenerator)
 * - receipt persistence with UNIQUE-race mapping to ConflictError
 * - optional tenant email delivery with status tracking
 *
 * The controller stays a thin HTTP adapter: it validates input and
 * shapes the response; all business flow lives here.
 */

const Receipt = require('../models/Receipt');
const Tenant = require('../models/Tenant');
const PDFGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');
const { NotFoundError, ConflictError } = require('../utils/errors');

/**
 * Build the receipt data payload handed to the PDF generator.
 * @param {Object} input - Validated generation input.
 * @returns {Object} Receipt data for pdfGenerator.generateReceipt.
 */
const buildReceiptData = ({ month, year, amount, charges, paymentDate }) => ({
  month,
  year,
  amount,
  charges,
  paymentDate: paymentDate || new Date().toISOString().split('T')[0],
});

/**
 * Persist a receipt, translating the UNIQUE(tenant_id, month, year)
 * race guard into a typed ConflictError (#38).
 */
const persistReceipt = async (tenantId, month, year, amount, { fileName, filePath }) => {
  try {
    return await Receipt.create({
      tenant_id: tenantId,
      month,
      year,
      amount,
      fileName,
      filePath,
    });
  } catch (createErr) {
    if (String(createErr.message).includes('UNIQUE constraint')) {
      throw new ConflictError('Receipt already exists for this period');
    }
    throw createErr;
  }
};

/**
 * Deliver the receipt by email when requested and possible.
 * Email failure never fails the overall operation (#38).
 */
const deliverByEmail = async (tenant, sendEmail, receiptData, filePath, receipt) => {
  let emailResult = null;
  let responseMessage = 'Receipt generated successfully';

  if (!sendEmail) {
    return { emailResult, responseMessage };
  }

  if (!tenant.email) {
    return {
      emailResult: { success: false, error: 'No email address found for tenant' },
      responseMessage: 'Receipt generated successfully, but no email address found for tenant',
    };
  }

  try {
    emailResult = await emailService.sendReceiptEmail(
      tenant,
      receiptData,
      filePath,
      receipt.tracking_token
    );
    await Receipt.updateEmailStatus(receipt.id, true);
    responseMessage = 'Receipt generated and sent via email successfully';
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    responseMessage = 'Receipt generated successfully, but email sending failed';
    emailResult = { success: false, error: emailError.message };
  }

  return { emailResult, responseMessage };
};

/**
 * Generate a quittance end-to-end for a tenant and period.
 *
 * @param {Object} input - Pre-validated request payload.
 * @param {number|string} input.tenantId - Tenant identifier.
 * @param {number} input.month - Month 1-12.
 * @param {number} input.year - Year.
 * @param {number} input.amount - Rent amount (parsed float).
 * @param {number} [input.charges] - Charges amount.
 * @param {string} [input.paymentDate] - ISO payment date.
 * @param {boolean} [input.sendEmail] - Whether to email the receipt.
 * @returns {Promise<{receipt: Object, message: string, emailResult: Object|null}>}
 * @throws {NotFoundError} When the tenant does not exist.
 * @throws {ConflictError} When a receipt already exists for the period.
 */
const createReceipt = async ({
  tenantId,
  month,
  year,
  amount,
  charges,
  paymentDate,
  sendEmail,
}) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const existingReceipt = await Receipt.checkExists(tenantId, month, year);
  if (existingReceipt) {
    throw new ConflictError('Receipt already exists for this period');
  }

  const receiptData = buildReceiptData({
    month,
    year,
    amount,
    charges,
    paymentDate,
  });
  const generated = await PDFGenerator.generateReceipt(tenant, receiptData);

  const receipt = await persistReceipt(tenantId, month, year, amount, generated);

  const { emailResult, responseMessage } = await deliverByEmail(
    tenant,
    sendEmail,
    receiptData,
    generated.filePath,
    receipt
  );

  return { receipt, message: responseMessage, emailResult };
};

module.exports = {
  createReceipt,
  buildReceiptData,
};
