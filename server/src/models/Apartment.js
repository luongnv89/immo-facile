const { getDatabase } = require('../database/db');

class Apartment {
  static async create(apartmentData) {
    const db = getDatabase();
    const { name, address, city, postalCode, description } = apartmentData;
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO apartments (name, address, city, postalCode, description)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run([name, address, city, postalCode, description || ''], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID, ...apartmentData });
      });
      
      stmt.finalize();
    });
  }

  static async findAll() {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM apartments WHERE isActive = 1 ORDER BY name', (err, rows) => {
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
      db.get('SELECT * FROM apartments WHERE id = ? AND isActive = 1', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  static async findWithTenants() {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          a.*,
          COUNT(t.id) as tenantCount
        FROM apartments a
        LEFT JOIN tenants t ON a.id = t.apartment_id AND t.isActive = 1
        WHERE a.isActive = 1
        GROUP BY a.id
        ORDER BY a.name
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

  static async update(id, apartmentData) {
    const db = getDatabase();
    const { name, address, city, postalCode, description } = apartmentData;
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        UPDATE apartments 
        SET name = ?, address = ?, city = ?, postalCode = ?, description = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND isActive = 1
      `);
      
      stmt.run([name, address, city, postalCode, description || '', id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        if (this.changes === 0) {
          reject(new Error('Apartment not found or inactive'));
          return;
        }
        resolve({ id, ...apartmentData });
      });
      
      stmt.finalize();
    });
  }

  static async delete(id) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('UPDATE apartments SET isActive = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      
      stmt.run([id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        if (this.changes === 0) {
          reject(new Error('Apartment not found'));
          return;
        }
        resolve({ id, deleted: true });
      });
      
      stmt.finalize();
    });
  }

  static async getFullAddress(id) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get('SELECT address, city, postalCode FROM apartments WHERE id = ? AND isActive = 1', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          resolve(null);
          return;
        }
        resolve(`${row.address}, ${row.postalCode} ${row.city}`);
      });
    });
  }
}

module.exports = Apartment;
