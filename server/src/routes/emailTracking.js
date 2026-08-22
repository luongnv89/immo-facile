/**
 * Email Tracking Routes
 * Task 1.2.2: Email Tracking System
 */

const express = require('express');
const router = express.Router();
const emailTrackingController = require('../controllers/emailTrackingController');

// GET /api/email-tracking/receipt/:receiptId - Get tracking stats for a receipt
router.get('/receipt/:receiptId', emailTrackingController.getReceiptStats);

// GET /api/email-tracking/analytics - Get overall email analytics
router.get('/analytics', emailTrackingController.getAnalytics);

// GET /api/email-tracking/clients - Get email client distribution
router.get('/clients', emailTrackingController.getEmailClientStats);

// GET /api/email-tracking/devices - Get device type distribution
router.get('/devices', emailTrackingController.getDeviceStats);

// GET /api/email-tracking/pixel/:token - Tracking pixel endpoint
router.get('/pixel/:token', emailTrackingController.trackOpen);

module.exports = router;
