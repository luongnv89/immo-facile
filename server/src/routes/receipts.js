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

// DELETE /api/receipts/:id - Delete receipt
router.delete('/:id', receiptController.deleteReceipt);

module.exports = router;
