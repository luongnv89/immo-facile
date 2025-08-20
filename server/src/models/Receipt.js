const { getDatabase } = require('../database/db');

class Receipt {
  static async create(receiptData) {
    const db = getDatabase();
    const { tenant_id, month, year, amount, template_id = 1, fileName, filePath, email_sent = false } = receiptData;
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO receipts (tenant_id, month, year, amount, template_id, fileName, file_path, email_sent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([tenant_id, month, year, amount, template_id, fileName, filePath, email_sent ? 1 : 0], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID, ...receiptData, email_sent });
      });
      
      stmt.finalize();
    });
  }

  static async findByTenantId(tenantId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT r.*, t.firstName, t.lastName 
        FROM receipts r 
        JOIN tenants t ON r.tenant_id = t.id 
        WHERE r.tenant_id = ? 
        ORDER BY r.year DESC, r.month DESC
      `, [tenantId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  static async findAll() {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT r.*, t.firstName, t.lastName, rt.name as template_name
        FROM receipts r 
        JOIN tenants t ON r.tenant_id = t.id 
        LEFT JOIN receipt_templates rt ON r.template_id = rt.id
        ORDER BY r.id DESC
      `, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  static async findById(id) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT r.*, t.firstName, t.lastName, t.address, t.email 
        FROM receipts r 
        JOIN tenants t ON r.tenant_id = t.id 
        WHERE r.id = ?
      `, [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
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
      
      stmt.run([emailSent ? 1 : 0, id], function(err) {
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
      db.get('SELECT id FROM receipts WHERE tenant_id = ? AND month = ? AND year = ?', 
        [tenantId, month, year], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(!!row);
      });
    });
  }

  static async delete(id) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('DELETE FROM receipts WHERE id = ?');
      
      stmt.run([id], function(err) {
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
}

module.exports = Receipt;
