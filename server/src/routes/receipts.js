const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');

// POST /api/receipts/generate - Generate new receipt
router.post('/generate', receiptController.generateReceipt);

// GET /api/receipts - Get all receipts
router.get('/', receiptController.getAllReceipts);

// GET /api/receipts/tenant/:tenantId - Get receipts by tenant ID
router.get('/tenant/:tenantId', receiptController.getReceiptsByTenant);

// GET /api/receipts/download/:id - Download receipt PDF
router.get('/download/:id', receiptController.downloadReceipt);

// POST /api/receipts/email/:id - Send receipt via email
router.post('/email/:id', receiptController.sendReceiptEmail);

// GET /api/receipts/track/:token - Track email open (tracking pixel)
router.get('/track/:token', receiptController.trackEmailOpen);

// PATCH /api/receipts/:id/payment-status - Update payment status
router.patch('/:id/payment-status', receiptController.updatePaymentStatus);

// POST /api/receipts/:id/record-payment - Record payment
router.post('/:id/record-payment', receiptController.recordPayment);

// GET /api/receipts/payment-status/:status - Get receipts by payment status
router.get('/payment-status/:status', receiptController.getReceiptsByPaymentStatus);

// GET /api/receipts/:id/payment-history - Get payment history
router.get('/:id/payment-history', receiptController.getPaymentHistory);

// DELETE /api/receipts/:id - Delete receipt
router.delete('/:id', receiptController.deleteReceipt);

module.exports = router;
