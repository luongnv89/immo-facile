const Receipt = require('../models/Receipt');
const Tenant = require('../models/Tenant');
const PDFGenerator = require('../utils/pdfGenerator');
const emailService = require('../utils/emailService');
const trackingService = require('../services/trackingService');
const fs = require('fs');
const path = require('path');

const receiptController = {
  // Generate new receipt
  async generateReceipt(req, res) {
    try {
      const { tenantId, month, year, amount, charges, paymentDate, sendEmail } = req.body;

      // Validation
      if (!tenantId || !month || !year || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['tenantId', 'month', 'year', 'amount'],
        });
      }

      // Task 4.2 (#38): numeric / range validation
      const m = Number(month);
      const y = Number(year);
      if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 2000 || y > 2100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid period',
          message: 'month must be 1-12 and year must be a plausible integer',
        });
      }
      if (!Number.isFinite(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount',
          message: 'amount must be a positive number',
        });
      }
      if (charges !== undefined && charges !== null && !(parseFloat(charges) >= 0)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid charges',
          message: 'charges must be zero or a positive number',
        });
      }

      // Check if tenant exists
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found',
        });
      }

      // Check if receipt already exists
      const existingReceipt = await Receipt.checkExists(tenantId, month, year);
      if (existingReceipt) {
        return res.status(409).json({
          success: false,
          error: 'Receipt already exists for this period',
          message: `Receipt for ${month}/${year} already generated for this tenant`,
        });
      }

      // Generate PDF
      const receiptData = {
        month,
        year,
        amount: parseFloat(amount),
        charges: parseFloat(charges),
        paymentDate: paymentDate || new Date().toISOString().split('T')[0], // Use provided date or default to today
      };
      const { fileName, filePath } = await PDFGenerator.generateReceipt(tenant, receiptData);

      // Debug: Log the generated filename
      console.log('Generated filename:', fileName);
      console.log('Download will use filename from DB:', fileName);

      // Save receipt record
      let receipt;
      try {
        receipt = await Receipt.create({
          tenant_id: tenantId,
          month,
          year,
          amount: parseFloat(amount),
          fileName,
          filePath,
        });
      } catch (createErr) {
        // Task 4.2 (#38): UNIQUE(tenant_id, month, year) guards against races
        if (String(createErr.message).includes('UNIQUE constraint')) {
          return res.status(409).json({
            success: false,
            error: 'Receipt already exists for this period',
          });
        }
        throw createErr;
      }

      let emailResult = null;
      let responseMessage = 'Receipt generated successfully';

      // Send email if requested and tenant has email
      if (sendEmail && tenant.email) {
        try {
          emailResult = await emailService.sendReceiptEmail(
            tenant,
            receiptData,
            filePath,
            receipt.tracking_token
          );
          // Update email status in database
          await Receipt.updateEmailStatus(receipt.id, true);
          responseMessage = 'Receipt generated and sent via email successfully';
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          // Don't fail the entire operation if email fails
          responseMessage = 'Receipt generated successfully, but email sending failed';
          emailResult = { success: false, error: emailError.message };
        }
      } else if (sendEmail && !tenant.email) {
        responseMessage = 'Receipt generated successfully, but no email address found for tenant';
        emailResult = { success: false, error: 'No email address found for tenant' };
      }

      res.status(201).json({
        success: true,
        data: receipt,
        message: responseMessage,
        emailSent: emailResult,
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate receipt',
        message: error.message,
      });
    }
  },

  // Get all receipts
  async getAllReceipts(req, res) {
    try {
      const receipts = await Receipt.findAll();
      res.json({
        success: true,
        data: receipts,
        count: receipts.length,
      });
    } catch (error) {
      console.error('Error fetching receipts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch receipts',
        message: error.message,
      });
    }
  },

  // Get receipts by tenant ID
  async getReceiptsByTenant(req, res) {
    try {
      const { tenantId } = req.params;
      const receipts = await Receipt.findByTenantId(tenantId);

      res.json({
        success: true,
        data: receipts,
        count: receipts.length,
      });
    } catch (error) {
      console.error('Error fetching tenant receipts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tenant receipts',
        message: error.message,
      });
    }
  },

  // Download receipt file
  async downloadReceipt(req, res) {
    try {
      const { id } = req.params;
      const receipt = await Receipt.findById(id);

      if (!receipt) {
        return res.status(404).json({
          success: false,
          error: 'Receipt not found',
        });
      }

      // Debug: Log what we get from database
      console.log('Receipt from DB:', {
        id: receipt.id,
        fileName: receipt.fileName,
        filePath: receipt.file_path,
      });

      const filePath = receipt.file_path || receipt.filePath;

      if (!filePath) {
        return res.status(404).json({
          success: false,
          error: 'File path not found in database',
          message: 'The receipt record does not contain a valid file path',
        });
      }

      if (!fs.existsSync(filePath)) {
        console.log('File not found at path:', filePath);
        return res.status(404).json({
          success: false,
          error: 'Receipt file not found',
          message: `The PDF file may have been moved or deleted. Path: ${filePath}`,
        });
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
          res.status(500).json({
            success: false,
            error: 'Failed to download receipt',
          });
        }
      });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download receipt',
        message: error.message,
      });
    }
  },

  // Send email for existing receipt
  async sendReceiptEmail(req, res) {
    try {
      const { id } = req.params;

      // Get receipt info with tracking token
      const receipt = await Receipt.findById(id);
      if (!receipt) {
        return res.status(404).json({
          success: false,
          error: 'Receipt not found',
        });
      }

      // Get tenant info
      const tenant = await Tenant.findById(receipt.tenant_id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found',
        });
      }

      // Check if tenant has email
      if (!tenant.email) {
        return res.status(400).json({
          success: false,
          error: 'No email address found for tenant',
        });
      }

      // Check if file exists
      if (!fs.existsSync(receipt.filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Receipt file not found',
        });
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
    } catch (error) {
      console.error('Error sending receipt email:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send receipt email',
        message: error.message,
      });
    }
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
          console.log(`Email opened for receipt ID: ${receipt.id}`);
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
    try {
      const { id } = req.params;

      // Get receipt info before deletion
      const receipt = await Receipt.findById(id);
      if (!receipt) {
        return res.status(404).json({
          success: false,
          error: 'Receipt not found',
        });
      }

      // Delete file if it exists
      if (receipt.filePath && fs.existsSync(receipt.filePath)) {
        fs.unlinkSync(receipt.filePath);
      }

      // Delete database record
      await Receipt.delete(id);

      res.json({
        success: true,
        message: 'Receipt deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting receipt:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Receipt not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete receipt',
        message: error.message,
      });
    }
  },

  // Task 1.1.2: Payment Status Management Endpoints

  /**
   * Update payment status
   * PATCH /api/v1/receipts/:id/payment-status
   */
  async updatePaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Payment status is required',
          validStatuses: ['pending', 'paid', 'late', 'partial'],
        });
      }

      const result = await Receipt.updatePaymentStatus(parseInt(id), status);

      res.json({
        success: true,
        data: result,
        message: `Payment status updated to '${status}'`,
      });
    } catch (error) {
      console.error('Error updating payment status:', error);

      if (error.message.includes('Invalid payment status')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Receipt not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update payment status',
        message: error.message,
      });
    }
  },

  /**
   * Record payment
   * POST /api/v1/receipts/:id/record-payment
   */
  async recordPayment(req, res) {
    try {
      const { id } = req.params;
      const { payment_date, payment_method, notes } = req.body;

      const result = await Receipt.recordPayment(parseInt(id), {
        payment_date,
        payment_method,
        notes,
      });

      res.json({
        success: true,
        data: result,
        message: 'Payment recorded successfully',
      });
    } catch (error) {
      console.error('Error recording payment:', error);

      if (
        error.message.includes('Invalid payment method') ||
        error.message.includes('cannot be in the future')
      ) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Receipt not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to record payment',
        message: error.message,
      });
    }
  },

  /**
   * Get receipts by payment status
   * GET /api/v1/receipts/payment-status/:status
   */
  async getReceiptsByPaymentStatus(req, res) {
    try {
      const { status } = req.params;

      const receipts = await Receipt.findByPaymentStatus(status);

      res.json({
        success: true,
        data: receipts,
        count: receipts.length,
        status: status,
      });
    } catch (error) {
      console.error('Error fetching receipts by payment status:', error);

      if (error.message.includes('Invalid payment status')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch receipts',
        message: error.message,
      });
    }
  },

  /**
   * Get payment history for a receipt
   * GET /api/v1/receipts/:id/payment-history
   */
  async getPaymentHistory(req, res) {
    try {
      const { id } = req.params;

      const receipt = await Receipt.getPaymentHistory(parseInt(id));

      res.json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      console.error('Error fetching payment history:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Receipt not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment history',
        message: error.message,
      });
    }
  },
};

module.exports = receiptController;
