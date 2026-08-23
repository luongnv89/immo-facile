/**
 * EmailTracking Model
 * Task 1.2.2: Email Tracking System · consolidated in Task 5.2 (#44)
 *
 * DB-only data access for email tracking and analytics.
 * Pipeline/business logic lives in services/trackingService.js.
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
   * Record email open event.
   * Compat shim: pipeline logic (GDPR pseudonymization, UA parsing) lives in
   * services/trackingService.js; this keeps existing callers working unchanged.
   * @param {string} trackingToken - Tracking token
   * @param {Object} metadata - Request metadata ({ userAgent, ipAddress })
   * @returns {Promise<Object>} Persist result
   */
  static async recordOpen(trackingToken, metadata = {}) {
    // Lazy require to avoid a circular import at load time
    const trackingService = require('../services/trackingService');
    return trackingService.recordOpen(trackingToken, metadata);
  }

  /**
   * Persist an open event using pre-sanitized values (DB only).
   * Called by trackingService.recordOpen after pseudonymization/UA parsing.
   * @param {string} trackingToken - Tracking token
   * @param {Object} safe - Sanitized fields ({ userAgent, ipAddress, deviceType, emailClient, isMobile })
   * @returns {Promise<Object>} Persist result ({ success, tracking_id, open_count })
   */
  static async persistOpen(trackingToken, safe) {
    const db = getDatabase();
    const { userAgent, ipAddress, deviceType, emailClient, isMobile } = safe;

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
            [userAgent, ipAddress, deviceType, emailClient, isMobile ? 1 : 0, trackingToken],
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

              // Resolve only after the event insert completes so callers reading
              // email_events never race the write (flaky under CI load otherwise).
              eventStmt.run([tracking.id, userAgent, ipAddress], eventErr => {
                if (eventErr) {
                  console.error('Error creating event record:', eventErr);
                }
                eventStmt.finalize();
                updateStmt.finalize();
                resolve({
                  success: true,
                  tracking_id: tracking.id,
                  open_count: tracking.open_count + 1,
                });
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
   * Fetch raw aggregate analytics from the database.
   * Derived metrics (open rate) are computed in trackingService.getAnalytics.
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Raw aggregate stats row
   */
  static async getAggregateAnalytics(filters = {}) {
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
          resolve(stats);
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
