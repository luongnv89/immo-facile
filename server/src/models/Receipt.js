const { getDatabase } = require('../database/db');
const crypto = require('crypto');

class Receipt {
  static async create(receiptData) {
    const db = getDatabase();
    const { tenant_id, month, year, amount, fileName, filePath, email_sent = false } = receiptData;

    // Generate unique tracking token
    const tracking_token = crypto.randomBytes(32).toString('hex');

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO receipts (tenant_id, month, year, amount, fileName, file_path, email_sent, tracking_token)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        [tenant_id, month, year, amount, fileName, filePath, email_sent ? 1 : 0, tracking_token],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID, ...receiptData, email_sent, tracking_token });
        }
      );

      stmt.finalize();
    });
  }

  static async findByTenantId(tenantId) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT r.*, r.file_path AS filePath, t.firstName, t.lastName 
        FROM receipts r 
        JOIN tenants t ON r.tenant_id = t.id 
        WHERE r.tenant_id = ? 
        ORDER BY r.year DESC, r.month DESC
      `,
        [tenantId],
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

  static async findAll() {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT r.*, r.file_path AS filePath, t.firstName, t.lastName 
        FROM receipts r 
        JOIN tenants t ON r.tenant_id = t.id 
        ORDER BY r.id DESC
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

  static async findById(id) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.get(
        `
        SELECT r.*, r.file_path AS filePath, t.firstName, t.lastName, t.email 
        FROM receipts r 
        JOIN tenants t ON r.tenant_id = t.id 
        WHERE r.id = ?
      `,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  }

  static async updateEmailStatus(id, emailSent = true) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE receipts 
        SET email_sent = ?, email_sent_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);

      stmt.run([emailSent ? 1 : 0, id], function (err) {
        if (err) {
          reject(err);
          return;
        }
        if (this.changes === 0) {
          reject(new Error('Receipt not found'));
          return;
        }
        resolve({ id, email_sent: emailSent, updated: true });
      });

      stmt.finalize();
    });
  }

  static async checkExists(tenantId, month, year) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM receipts WHERE tenant_id = ? AND month = ? AND year = ?',
        [tenantId, month, year],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(!!row);
        }
      );
    });
  }

  static async delete(id) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      const stmt = db.prepare('DELETE FROM receipts WHERE id = ?');

      stmt.run([id], function (err) {
        if (err) {
          reject(err);
          return;
        }
        if (this.changes === 0) {
          reject(new Error('Receipt not found'));
          return;
        }
        resolve({ id, deleted: true });
      });

      stmt.finalize();
    });
  }

  static async findByTrackingToken(token) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.get('SELECT id FROM receipts WHERE tracking_token = ?', [token], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  static async updateEmailOpened(id) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      // Only update if not already marked as opened
      const stmt = db.prepare(`
        UPDATE receipts 
        SET email_opened = 1, email_opened_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND email_opened = 0
      `);

      stmt.run([id], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id, email_opened: true, updated: this.changes > 0 });
      });

      stmt.finalize();
    });
  }

  // Task 1.1.2: Payment Status Management Methods

  /**
   * Update payment status of a receipt
   * @param {number} id - Receipt ID
   * @param {string} status - Payment status (pending, paid, late, partial)
   * @returns {Promise<Object>} Updated receipt data
   */
  static async updatePaymentStatus(id, status) {
    const db = getDatabase();
    const validStatuses = ['pending', 'paid', 'late', 'partial'];

    if (!validStatuses.includes(status)) {
      return Promise.reject(
        new Error(`Invalid payment status. Must be one of: ${validStatuses.join(', ')}`)
      );
    }

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE receipts 
        SET payment_status = ? 
        WHERE id = ?
      `);

      stmt.run([status, id], function (err) {
        if (err) {
          reject(err);
          return;
        }
        if (this.changes === 0) {
          reject(new Error('Receipt not found'));
          return;
        }
        resolve({ id, payment_status: status, updated: true });
      });

      stmt.finalize();
    });
  }

  /**
   * Record payment for a receipt
   * @param {number} id - Receipt ID
   * @param {Object} paymentData - Payment details
   * @param {string} paymentData.payment_date - Payment date (ISO format)
   * @param {string} paymentData.payment_method - Payment method
   * @param {string} paymentData.notes - Optional notes
   * @returns {Promise<Object>} Updated receipt data
   */
  static async recordPayment(id, paymentData) {
    const db = getDatabase();
    const { payment_date, payment_method, notes } = paymentData;
    const validMethods = ['bank_transfer', 'check', 'cash', 'other'];

    // Validate payment method
    if (payment_method && !validMethods.includes(payment_method)) {
      return Promise.reject(
        new Error(`Invalid payment method. Must be one of: ${validMethods.join(', ')}`)
      );
    }

    // Validate payment date is not in the future
    if (payment_date) {
      const paymentDateObj = new Date(payment_date);
      const now = new Date();
      if (paymentDateObj > now) {
        return Promise.reject(new Error('Payment date cannot be in the future'));
      }
    }

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE receipts 
        SET payment_status = 'paid', 
            payment_date = ?, 
            payment_method = ?,
            notes = ?
        WHERE id = ?
      `);

      stmt.run(
        [payment_date || new Date().toISOString(), payment_method, notes, id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          if (this.changes === 0) {
            reject(new Error('Receipt not found'));
            return;
          }
          resolve({
            id,
            payment_status: 'paid',
            payment_date: payment_date || new Date().toISOString(),
            payment_method,
            notes,
            updated: true,
          });
        }
      );

      stmt.finalize();
    });
  }

  /**
   * Find receipts by payment status
   * @param {string} status - Payment status to filter by
   * @returns {Promise<Array>} Array of receipts
   */
  static async findByPaymentStatus(status) {
    const db = getDatabase();
    const validStatuses = ['pending', 'paid', 'late', 'partial'];

    if (!validStatuses.includes(status)) {
      return Promise.reject(
        new Error(`Invalid payment status. Must be one of: ${validStatuses.join(', ')}`)
      );
    }

    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT r.*, r.file_path AS filePath, t.firstName, t.lastName, t.email
        FROM receipts r 
        JOIN tenants t ON r.tenant_id = t.id 
        WHERE r.payment_status = ?
        ORDER BY r.year DESC, r.month DESC
      `,
        [status],
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
   * Get payment history for a receipt
   * @param {number} id - Receipt ID
   * @returns {Promise<Object>} Receipt with payment history
   */
  static async getPaymentHistory(id) {
    const db = getDatabase();

    return new Promise((resolve, reject) => {
      db.get(
        `
        SELECT r.*, r.file_path AS filePath, t.firstName, t.lastName, t.email
        FROM receipts r 
        JOIN tenants t ON r.tenant_id = t.id 
        WHERE r.id = ?
      `,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            reject(new Error('Receipt not found'));
            return;
          }
          resolve(row);
        }
      );
    });
  }
}

module.exports = Receipt;
