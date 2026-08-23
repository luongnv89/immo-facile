const { getDatabase } = require('../database/db');
const { DEFAULT_PAGE_SIZE } = require('../utils/pagination');

class Apartment {
  static async create(apartmentData) {
    const db = getDatabase();
    const { name, address, city, postalCode, description } = apartmentData;

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO apartments (name, address, city, postalCode, description)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run([name, address, city, postalCode, description || ''], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID, ...apartmentData });
      });

      stmt.finalize();
    });
  }

  /**
   * Paginated list of active apartments (#57).
   * @param {{page?: number, limit?: number}} [options]
   * @returns {Promise<{rows: Array, total: number}>} Page rows + total count.
   */
  static async findAll({ page = 1, limit = DEFAULT_PAGE_SIZE } = {}) {
    const db = getDatabase();
    const offset = (page - 1) * limit;

    const [rows, countRow] = await Promise.all([
      new Promise((resolve, reject) => {
        db.all(
          'SELECT * FROM apartments WHERE isActive = 1 ORDER BY name LIMIT ? OFFSET ?',
          [limit, offset],
          (err, result) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(result);
          }
        );
      }),
      new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) AS c FROM apartments WHERE isActive = 1', (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        });
      }),
    ]);

    return { rows, total: countRow.c };
  }

  /**
   * Paginated apartments with their active-tenant counts (#57).
   * @param {{page?: number, limit?: number}} [options]
   * @returns {Promise<{rows: Array, total: number}>} Page rows + total count.
   */
  static async findWithTenants({ page = 1, limit = DEFAULT_PAGE_SIZE } = {}) {
    const db = getDatabase();
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        a.*,
        COUNT(t.id) as tenantCount
      FROM apartments a
      LEFT JOIN tenants t ON a.id = t.apartment_id AND t.isActive = 1
      WHERE a.isActive = 1
      GROUP BY a.id
      ORDER BY a.name
      LIMIT ? OFFSET ?
    `;

    const [rows, countRow] = await Promise.all([
      new Promise((resolve, reject) => {
        db.all(query, [limit, offset], (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(result);
        });
      }),
      new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) AS c FROM apartments WHERE isActive = 1', (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        });
      }),
    ]);

    return { rows, total: countRow.c };
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

      stmt.run([name, address, city, postalCode, description || '', id], function (err) {
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
      const stmt = db.prepare(
        'UPDATE apartments SET isActive = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      );

      stmt.run([id], function (err) {
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
      db.get(
        'SELECT address, city, postalCode FROM apartments WHERE id = ? AND isActive = 1',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            resolve(null);
            return;
          }
          resolve(`${row.address}, ${row.postalCode} ${row.city}`);
        }
      );
    });
  }
}

module.exports = Apartment;
