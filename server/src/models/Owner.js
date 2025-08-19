const { getDatabase } = require('../database/db');

class Owner {
  static getOwner() {
    try {
      const db = getDatabase();
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM owner LIMIT 1', (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        });
      });
    } catch (error) {
      console.error('Error getting owner:', error);
      throw error;
    }
  }

  static updateOwner(data) {
    try {
      const { name, address1, address2, signature, signature_path } = data;
      const db = getDatabase();
      
      return new Promise((resolve, reject) => {
        db.run(`
          UPDATE owner 
          SET name = ?, address1 = ?, address2 = ?, signature = ?, signature_path = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `, [name, address1, address2 || null, signature || null, signature_path || null], function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          if (this.changes === 0) {
            // If no owner exists, create one
            db.run(`
              INSERT INTO owner (name, address1, address2, signature, signature_path)
              VALUES (?, ?, ?, ?, ?)
            `, [name, address1, address2 || null, signature || null, signature_path || null], (insertErr) => {
              if (insertErr) {
                reject(insertErr);
                return;
              }
              Owner.getOwner().then(resolve).catch(reject);
            });
          } else {
            Owner.getOwner().then(resolve).catch(reject);
          }
        });
      });
    } catch (error) {
      console.error('Error updating owner:', error);
      throw error;
    }
  }

  static createOwner(data) {
    try {
      const { name, address1, address2, signature, signature_path } = data;
      const db = getDatabase();
      
      return new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO owner (name, address1, address2, signature, signature_path)
          VALUES (?, ?, ?, ?, ?)
        `, [name, address1, address2 || null, signature || null, signature_path || null], function(err) {
          if (err) {
            reject(err);
            return;
          }
          Owner.getOwner().then(resolve).catch(reject);
        });
      });
    } catch (error) {
      console.error('Error creating owner:', error);
      throw error;
    }
  }

  static deleteOwner(id) {
    try {
      const db = getDatabase();
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM owner WHERE id = ?', [id], function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.changes > 0);
        });
      });
    } catch (error) {
      console.error('Error deleting owner:', error);
      throw error;
    }
  }
}

module.exports = Owner;
