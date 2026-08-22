/**
 * EmailTracking Model
 * Task 1.2.2: Email Tracking System
 *
 * Manages email tracking and analytics
 */

const { getDatabase } = require('../database/db');
const crypto = require('crypto');

class EmailTracking {
  /**
   * Create a new email tracking record
   * @param {Object} data - Email tracking data
   * @returns {Promise<Object>} Created tracking record
   */
  static async create(data) {
    const db = getDatabase();
    const { receipt_id, email_type, recipient_email, subject } = data;

    // Generate unique tracking token
    const tracking_token = crypto.randomBytes(32).toString('hex');

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO email_tracking (
          receipt_id, email_type, tracking_token, recipient_email, subject
        ) VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run([receipt_id, email_type, tracking_token, recipient_email, subject], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({
          id: this.lastID,
          tracking_token,
          ...data,
        });
      });

      stmt.finalize();
    });
  }

  /**
   * Record email open event
   * @param {string} trackingToken - Tracking token
   * @param {Object} metadata - Request metadata (user agent, IP, etc.)
   * @returns {Promise<Object>} Updated tracking record
   */
  static async recordOpen(trackingToken, metadata = {}) {
    const db = getDatabase();
    const { userAgent, ipAddress } = metadata;

    return new Promise((resolve, reject) => {
      // First, get the tracking record
      db.get(
        'SELECT * FROM email_tracking WHERE tracking_token = ?',
        [trackingToken],
        (err, tracking) => {
          if (err) {
            reject(err);
            return;
          }

          if (!tracking) {
            reject(new Error('Tracking record not found'));
            return;
          }

          // Parse device info from user agent
          const deviceInfo = this.parseUserAgent(userAgent);

          // Update tracking record
          const updateStmt = db.prepare(`
            UPDATE email_tracking 
            SET opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP),
                last_opened_at = CURRENT_TIMESTAMP,
                open_count = open_count + 1,
                user_agent = ?,
                ip_address = ?,
                device_type = ?,
                email_client = ?,
                is_mobile = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE tracking_token = ?
          `);

          updateStmt.run(
            [
              userAgent,
              ipAddress,
              deviceInfo.deviceType,
              deviceInfo.emailClient,
              deviceInfo.isMobile ? 1 : 0,
              trackingToken,
            ],
            function (updateErr) {
              if (updateErr) {
                reject(updateErr);
                return;
              }

              // Create event record
              const eventStmt = db.prepare(`
              INSERT INTO email_events (tracking_id, event_type, user_agent, ip_address)
              VALUES (?, 'opened', ?, ?)
            `);

              eventStmt.run([tracking.id, userAgent, ipAddress], eventErr => {
                if (eventErr) {
                  console.error('Error creating event record:', eventErr);
                }
              });

              eventStmt.finalize();
              updateStmt.finalize();

              resolve({
                success: true,
                tracking_id: tracking.id,
                open_count: tracking.open_count + 1,
              });
            }
          );
        }
      );
    });
  }

  /**
   * Get tracking statistics for a receipt
   * @param {number} receiptId - Receipt ID
   * @returns {Promise<Object>} Tracking statistics
   */
  static async getStatsByReceipt(receiptId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          et.*,
          COUNT(ee.id) as total_events
        FROM email_tracking et
        LEFT JOIN email_events ee ON et.id = ee.tracking_id
        WHERE et.receipt_id = ?
        GROUP BY et.id
        ORDER BY et.sent_at DESC
      `,
        [receiptId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  }

  /**
   * Get overall email analytics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Analytics data
   */
  static async getAnalytics(filters = {}) {
    const db = getDatabase();
    const { startDate, endDate, emailType } = filters;

    let whereClause = '1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND sent_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND sent_at <= ?';
      params.push(endDate);
    }

    if (emailType) {
      whereClause += ' AND email_type = ?';
      params.push(emailType);
    }

    return new Promise((resolve, reject) => {
      db.get(
        `
        SELECT 
          COUNT(*) as total_sent,
          SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as total_opened,
          SUM(open_count) as total_opens,
          AVG(open_count) as avg_opens_per_email,
          SUM(CASE WHEN is_mobile = 1 THEN 1 ELSE 0 END) as mobile_opens,
          SUM(CASE WHEN bounce_type != 'none' THEN 1 ELSE 0 END) as total_bounces,
          SUM(CASE WHEN unsubscribed = 1 THEN 1 ELSE 0 END) as total_unsubscribes
        FROM email_tracking
        WHERE ${whereClause}
      `,
        params,
        (err, stats) => {
          if (err) {
            reject(err);
            return;
          }

          // Calculate open rate
          const openRate =
            stats.total_sent > 0 ? ((stats.total_opened / stats.total_sent) * 100).toFixed(2) : 0;

          resolve({
            ...stats,
            open_rate: parseFloat(openRate),
          });
        }
      );
    });
  }

  /**
   * Get email client distribution
   * @returns {Promise<Array>} Email client statistics
   */
  static async getEmailClientStats() {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          email_client,
          COUNT(*) as count,
          SUM(open_count) as total_opens
        FROM email_tracking
        WHERE email_client IS NOT NULL
        GROUP BY email_client
        ORDER BY count DESC
      `,
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  }

  /**
   * Get device type distribution
   * @returns {Promise<Array>} Device type statistics
   */
  static async getDeviceStats() {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          device_type,
          COUNT(*) as count,
          SUM(CASE WHEN is_mobile = 1 THEN 1 ELSE 0 END) as mobile_count
        FROM email_tracking
        WHERE device_type IS NOT NULL
        GROUP BY device_type
        ORDER BY count DESC
      `,
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  }

  /**
   * Parse user agent string to extract device info
   * @param {string} userAgent - User agent string
   * @returns {Object} Parsed device information
   */
  static parseUserAgent(userAgent) {
    if (!userAgent) {
      return {
        deviceType: 'unknown',
        emailClient: 'unknown',
        isMobile: false,
      };
    }

    const ua = userAgent.toLowerCase();

    // Detect mobile
    const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);

    // Detect device type
    let deviceType = 'desktop';
    if (/ipad|tablet/i.test(ua)) {
      deviceType = 'tablet';
    } else if (isMobile) {
      deviceType = 'mobile';
    }

    // Detect email client
    let emailClient = 'unknown';
    if (/gmail/i.test(ua)) {
      emailClient = 'Gmail';
    } else if (/outlook/i.test(ua)) {
      emailClient = 'Outlook';
    } else if (/apple mail|mail\.app/i.test(ua)) {
      emailClient = 'Apple Mail';
    } else if (/yahoo/i.test(ua)) {
      emailClient = 'Yahoo Mail';
    } else if (/thunderbird/i.test(ua)) {
      emailClient = 'Thunderbird';
    } else if (/webmail/i.test(ua)) {
      emailClient = 'Webmail';
    }

    return {
      deviceType,
      emailClient,
      isMobile,
    };
  }

  /**
   * Delete tracking records older than specified days
   * @param {number} days - Number of days to keep
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteOldRecords(days = 365) {
    const db = getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        DELETE FROM email_tracking 
        WHERE sent_at < ?
      `);

      stmt.run([cutoffDate.toISOString()], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({
          deleted: this.changes,
          cutoffDate: cutoffDate.toISOString(),
        });
      });

      stmt.finalize();
    });
  }
}

module.exports = EmailTracking;
