const Receipt = require('../models/Receipt');
const Tenant = require('../models/Tenant');
const PDFGenerator = require('../utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

const receiptController = {
  // Generate new receipt
  async generateReceipt(req, res) {
    try {
      const { tenantId, month, year, amount, charges, paymentDate } = req.body;

      // Validation
      if (!tenantId || !month || !year || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: ['tenantId', 'month', 'year', 'amount']
        });
      }

      // Check if tenant exists
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
      }

      // Check if receipt already exists
      const existingReceipt = await Receipt.checkExists(tenantId, month, year);
      if (existingReceipt) {
        return res.status(409).json({
          success: false,
          error: 'Receipt already exists for this period',
          message: `Receipt for ${month}/${year} already generated for this tenant`
        });
      }

      // Generate PDF
      const receiptData = { 
        month, 
        year, 
        amount: parseFloat(amount), 
        charges: parseFloat(charges),
        paymentDate: paymentDate || new Date().toISOString().split('T')[0] // Use provided date or default to today
      };
      const { fileName, filePath } = await PDFGenerator.generateReceipt(tenant, receiptData);

      // Debug: Log the generated filename
      console.log('Generated filename:', fileName);
      console.log('Download will use filename from DB:', fileName);

      // Save receipt record
      const receipt = await Receipt.create({
        tenant_id: tenantId,
        month,
        year,
        amount: parseFloat(amount),
        fileName,
        filePath
      });

      res.status(201).json({
        success: true,
        data: receipt,
        message: 'Receipt generated successfully'
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate receipt',
        message: error.message
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
        count: receipts.length
      });
    } catch (error) {
      console.error('Error fetching receipts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch receipts',
        message: error.message
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
        count: receipts.length
      });
    } catch (error) {
      console.error('Error fetching tenant receipts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tenant receipts',
        message: error.message
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
          error: 'Receipt not found'
        });
      }

      // Debug: Log what we get from database
      console.log('Receipt from DB:', { id: receipt.id, fileName: receipt.fileName });

      const filePath = receipt.filePath;
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Receipt file not found',
          message: 'The PDF file may have been moved or deleted'
        });
      }

      // Set headers for file download with proper filename encoding
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${receipt.fileName}"; filename*=UTF-8''${encodeURIComponent(receipt.fileName)}`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to download receipt'
          });
        }
      });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download receipt',
        message: error.message
      });
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
          error: 'Receipt not found'
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
        message: 'Receipt deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting receipt:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Receipt not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete receipt',
        message: error.message
      });
    }
  }
};

module.exports = receiptController;
