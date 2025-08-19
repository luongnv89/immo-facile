const { getDatabase } = require('../database/db');

class Tenant {
  static async create(tenantData) {
    const db = getDatabase();
    const { firstName, lastName, gender, email, phone, address, apartment_id, rentAmount, depositAmount, leaseStartDate, leaseEndDate, charges } = tenantData;
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO tenants (firstName, lastName, gender, email, phone, address, rentAmount, charges, depositAmount, leaseStartDate, leaseEndDate, apartment_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([firstName, lastName, gender, email, phone, address, rentAmount, charges || 0, depositAmount, leaseStartDate, leaseEndDate, apartment_id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID, ...tenantData });
      });
      
      stmt.finalize();
    });
  }

  static async findAll() {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          t.*,
          a.name as apartmentName,
          a.address as apartmentAddress,
          a.city as apartmentCity,
          a.postalCode as apartmentPostalCode
        FROM tenants t
        LEFT JOIN apartments a ON t.apartment_id = a.id
        WHERE t.isActive = 1 
        ORDER BY t.lastName, t.firstName
      `;
      
      db.all(query, (err, rows) => {
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
      const query = `
        SELECT 
          t.*,
          a.name as apartmentName,
          a.address as apartmentAddress,
          a.city as apartmentCity,
          a.postalCode as apartmentPostalCode
        FROM tenants t
        LEFT JOIN apartments a ON t.apartment_id = a.id
        WHERE t.id = ? AND t.isActive = 1
      `;
      
      db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  static async update(id, tenantData) {
    const db = getDatabase();
    const { firstName, lastName, gender, email, phone, address, apartment_id, rentAmount, charges, depositAmount, leaseStartDate, leaseEndDate } = tenantData;
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE tenants 
        SET firstName = ?, lastName = ?, gender = ?, email = ?, phone = ?, address = ?, apartment_id = ?, rentAmount = ?, charges = ?, depositAmount = ?, leaseStartDate = ?, leaseEndDate = ?
        WHERE id = ?
      `);
      
      stmt.run([firstName, lastName, gender, email, phone, address, apartment_id, rentAmount, charges || 0, depositAmount, leaseStartDate, leaseEndDate, id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id, ...tenantData });
      });
      
      stmt.finalize();
    });
  }

  static async delete(id) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('UPDATE tenants SET isActive = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      
      stmt.run([id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        if (this.changes === 0) {
          reject(new Error('Tenant not found'));
          return;
        }
        resolve({ id, deleted: true });
      });
      
      stmt.finalize();
    });
  }
}

module.exports = Tenant;
