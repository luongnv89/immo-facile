const Receipt = require('../models/Receipt');
const Tenant = require('../models/Tenant');
const fs = require('fs');
const receiptService = require('../services/receiptService');
const emailService = require('../utils/emailService');
const trackingService = require('../services/trackingService');
const { ValidationError, NotFoundError } = require('../utils/errors');

// Translate generic model errors into typed errors; anything
// else propagates to the centralized error middleware (500).
const isMessage = (err, fragment) => String(err.message || '').includes(fragment);

/**
 * Validate generation input (required fields, numeric and
 * range checks). Kept outside the handler so every controller method
 * stays <=50 lines (#50).
 */
const validateGenerationInput = body => {
  const { tenantId, month, year, amount, charges } = body;

  if (!tenantId || !month || !year || !amount) {
    throw new ValidationError('Missing required fields', {
      required: ['tenantId', 'month', 'year', 'amount'],
    });
  }

  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 2000 || y > 2100) {
    throw new ValidationError(
      'Invalid period',
      'month must be 1-12 and year must be a plausible integer'
    );
  }
  if (!Number.isFinite(parseFloat(amount)) || parseFloat(amount) <= 0) {
    throw new ValidationError('Invalid amount', 'amount must be a positive number');
  }
  if (charges !== undefined && charges !== null && !(parseFloat(charges) >= 0)) {
    throw new ValidationError('Invalid charges', 'charges must be zero or a positive number');
  }
};

const receiptController = {
  // Generate new receipt — orchestration lives in services/receiptService (#50)
  async generateReceipt(req, res) {
    const { tenantId, month, year, amount, charges, paymentDate, sendEmail } = req.body;

    validateGenerationInput(req.body);

    const { receipt, message, emailResult } = await receiptService.createReceipt({
      tenantId,
      month,
      year,
      amount: parseFloat(amount),
      charges: charges === undefined || charges === null ? undefined : parseFloat(charges),
      paymentDate,
      sendEmail,
    });

    res.status(201).json({
      success: true,
      data: receipt,
      message,
      emailSent: emailResult,
    });
  },

  // Get all receipts
  async getAllReceipts(req, res) {
    const receipts = await Receipt.findAll();
    res.json({
      success: true,
      data: receipts,
      count: receipts.length,
    });
  },

  // Get receipts by tenant ID
  async getReceiptsByTenant(req, res) {
    const { tenantId } = req.params;
    const receipts = await Receipt.findByTenantId(tenantId);

    res.json({
      success: true,
      data: receipts,
      count: receipts.length,
    });
  },

  // Download receipt file
  async downloadReceipt(req, res) {
    const { id } = req.params;
    const receipt = await Receipt.findById(id);

    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    const filePath = receipt.file_path || receipt.filePath;

    if (!filePath) {
      throw new NotFoundError('File path not found in database');
    }

    if (!fs.existsSync(filePath)) {
      throw new NotFoundError('Receipt file not found');
    }

    // Set headers for file download with proper filename encoding
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${receipt.fileName}"; filename*=UTF-8''${encodeURIComponent(receipt.fileName)}`
    );

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', error => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: { message: 'Failed to download receipt', code: 'INTERNAL_ERROR' } });
      }
    });
  },

  // Send email for existing receipt
  async sendReceiptEmail(req, res) {
    const { id } = req.params;

    // Get receipt info with tracking token
    const receipt = await Receipt.findById(id);
    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    // Get tenant info
    const tenant = await Tenant.findById(receipt.tenant_id);
    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    // Check if tenant has email
    if (!tenant.email) {
      throw new ValidationError('No email address found for tenant');
    }

    // Check if file exists
    if (!fs.existsSync(receipt.filePath)) {
      throw new NotFoundError('Receipt file not found');
    }

    // Prepare receipt data for email
    const receiptData = {
      month: receipt.month,
      year: receipt.year,
      amount: receipt.amount,
      charges: 0, // Default charges, could be enhanced to store charges in receipt model
    };

    // Send email with tracking token
    const emailResult = await emailService.sendReceiptEmail(
      tenant,
      receiptData,
      receipt.filePath,
      receipt.tracking_token
    );

    // Update email status in database
    await Receipt.updateEmailStatus(id, true);

    res.json({
      success: true,
      message: 'Receipt sent via email successfully',
      emailSent: emailResult,
    });
  },

  // Track email open via tracking pixel
  async trackEmailOpen(req, res) {
    try {
      const { token } = req.params;

      if (token) {
        // Find receipt by tracking token
        const receipt = await Receipt.findByTrackingToken(token);

        if (receipt) {
          // Update email opened status
          await Receipt.updateEmailOpened(receipt.id);
        }
      }

      // Always return a 1x1 transparent pixel (GIF)
      trackingService.sendTrackingPixel(res);
    } catch (error) {
      console.error('Error tracking email open:', error);
      // Still return pixel even on error
      trackingService.sendTrackingPixel(res);
    }
  },

  // Delete receipt
  async deleteReceipt(req, res) {
    const { id } = req.params;

    // Get receipt info before deletion
    const receipt = await Receipt.findById(id);
    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    // Delete file if it exists
    if (receipt.filePath && fs.existsSync(receipt.filePath)) {
      fs.unlinkSync(receipt.filePath);
    }

    // Delete database record
    try {
      await Receipt.delete(id);
    } catch (err) {
      if (isMessage(err, 'not found')) throw new NotFoundError('Receipt not found');
      throw err;
    }

    res.json({
      success: true,
      message: 'Receipt deleted successfully',
    });
  },

  /**
   * Update payment status
   * PATCH /api/v1/receipts/:id/payment-status
   */
  async updatePaymentStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new ValidationError('Payment status is required', [
        'pending',
        'paid',
        'late',
        'partial',
      ]);
    }

    let result;
    try {
      result = await Receipt.updatePaymentStatus(parseInt(id), status);
    } catch (err) {
      if (isMessage(err, 'Invalid payment status')) throw new ValidationError(err.message);
      if (isMessage(err, 'not found')) throw new NotFoundError('Receipt not found');
      throw err;
    }

    res.json({
      success: true,
      data: result,
      message: `Payment status updated to '${status}'`,
    });
  },

  /**
   * Record payment
   * POST /api/v1/receipts/:id/record-payment
   */
  async recordPayment(req, res) {
    const { id } = req.params;
    const { payment_date, payment_method, notes } = req.body;

    let result;
    try {
      result = await Receipt.recordPayment(parseInt(id), {
        payment_date,
        payment_method,
        notes,
      });
    } catch (err) {
      if (isMessage(err, 'Invalid payment method') || isMessage(err, 'cannot be in the future')) {
        throw new ValidationError(err.message);
      }
      if (isMessage(err, 'not found')) throw new NotFoundError('Receipt not found');
      throw err;
    }

    res.json({
      success: true,
      data: result,
      message: 'Payment recorded successfully',
    });
  },

  /**
   * Get receipts by payment status
   * GET /api/v1/receipts/payment-status/:status
   */
  async getReceiptsByPaymentStatus(req, res) {
    const { status } = req.params;

    let receipts;
    try {
      receipts = await Receipt.findByPaymentStatus(status);
    } catch (err) {
      if (isMessage(err, 'Invalid payment status')) throw new ValidationError(err.message);
      throw err;
    }

    res.json({
      success: true,
      data: receipts,
      count: receipts.length,
      status: status,
    });
  },

  /**
   * Get payment history for a receipt
   * GET /api/v1/receipts/:id/payment-history
   */
  async getPaymentHistory(req, res) {
    const { id } = req.params;

    let receipt;
    try {
      receipt = await Receipt.getPaymentHistory(parseInt(id));
    } catch (err) {
      if (isMessage(err, 'not found')) throw new NotFoundError('Receipt not found');
      throw err;
    }

    res.json({
      success: true,
      data: receipt,
    });
  },
};

module.exports = receiptController;
