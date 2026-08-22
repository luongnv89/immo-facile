/**
 * Email Tracking Controller
 * Task 1.2.2: Email Tracking System
 *
 * Handles email tracking analytics and reporting
 */

const EmailTracking = require('../models/EmailTracking');

const emailTrackingController = {
  /**
   * Get tracking statistics for a specific receipt
   * GET /api/email-tracking/receipt/:receiptId
   */
  async getReceiptStats(req, res) {
    try {
      const { receiptId } = req.params;

      const stats = await EmailTracking.getStatsByReceipt(parseInt(receiptId));

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching receipt tracking stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tracking statistics',
        message: error.message,
      });
    }
  },

  /**
   * Get overall email analytics
   * GET /api/email-tracking/analytics
   */
  async getAnalytics(req, res) {
    try {
      const { startDate, endDate, emailType } = req.query;

      const analytics = await EmailTracking.getAnalytics({
        startDate,
        endDate,
        emailType,
      });

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error('Error fetching email analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics',
        message: error.message,
      });
    }
  },

  /**
   * Get email client distribution
   * GET /api/email-tracking/clients
   */
  async getEmailClientStats(req, res) {
    try {
      const stats = await EmailTracking.getEmailClientStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching email client stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch email client statistics',
        message: error.message,
      });
    }
  },

  /**
   * Get device type distribution
   * GET /api/email-tracking/devices
   */
  async getDeviceStats(req, res) {
    try {
      const stats = await EmailTracking.getDeviceStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching device stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch device statistics',
        message: error.message,
      });
    }
  },

  /**
   * Track email open (tracking pixel endpoint)
   * GET /api/email-tracking/pixel/:token
   */
  async trackOpen(req, res) {
    try {
      const { token } = req.params;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.connection.remoteAddress;

      if (token) {
        // Record the open event asynchronously
        EmailTracking.recordOpen(token, { userAgent, ipAddress }).catch(err =>
          console.error('Error recording email open:', err)
        );
      }

      // Always return a 1x1 transparent pixel (GIF)
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );
      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
        Expires: '0',
      });
      res.end(pixel);
    } catch (error) {
      console.error('Error in tracking pixel:', error);
      // Still return pixel even on error
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      );
      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
      });
      res.end(pixel);
    }
  },
};

module.exports = emailTrackingController;
