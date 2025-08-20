const { getDatabase } = require('../database/db');

class Template {
  static async findAll() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM receipt_templates ORDER BY is_default DESC, created_at DESC', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse template_data JSON for each template
          const templates = rows.map(template => ({
            ...template,
            template_data: template.template_data ? JSON.parse(template.template_data) : null
          }));
          resolve(templates);
        }
      });
    });
  }

  static async findById(id) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM receipt_templates WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('Template not found'));
        } else {
          // Parse template_data JSON
          const template = {
            ...row,
            template_data: row.template_data ? JSON.parse(row.template_data) : null
          };
          resolve(template);
        }
      });
    });
  }

  static async findDefault() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM receipt_templates WHERE is_default = 1 LIMIT 1', (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('No default template found'));
        } else {
          // Parse template_data JSON
          const template = {
            ...row,
            template_data: row.template_data ? JSON.parse(row.template_data) : null
          };
          resolve(template);
        }
      });
    });
  }

  static async create(templateData) {
    const db = getDatabase();
    const { name, description, template_type, is_active, is_default, template_data, background_image_path, template_file_path } = templateData;
    
    return new Promise((resolve, reject) => {
      // If this template is being set as default, unset other defaults first
      if (is_default) {
        db.run('UPDATE receipt_templates SET is_default = 0', (err) => {
          if (err) {
            reject(err);
            return;
          }
          insertTemplate();
        });
      } else {
        insertTemplate();
      }

      function insertTemplate() {
        const stmt = db.prepare(`
          INSERT INTO receipt_templates (name, description, template_type, is_active, is_default, template_data, background_image_path, template_file_path)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
          name,
          description || null,
          template_type || 'custom',
          is_active !== undefined ? is_active : 1,
          is_default || 0,
          template_data ? JSON.stringify(template_data) : null,
          background_image_path || null,
          template_file_path || null
        ], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...templateData });
          }
        });
        
        stmt.finalize();
      }
    });
  }

  static async update(id, templateData) {
    const db = getDatabase();
    const { name, description, template_type, is_active, is_default, template_data, background_image_path, template_file_path } = templateData;
    
    return new Promise((resolve, reject) => {
      // If this template is being set as default, unset other defaults first
      if (is_default) {
        db.run('UPDATE receipt_templates SET is_default = 0 WHERE id != ?', [id], (err) => {
          if (err) {
            reject(err);
            return;
          }
          updateTemplate();
        });
      } else {
        updateTemplate();
      }

      function updateTemplate() {
        const stmt = db.prepare(`
          UPDATE receipt_templates 
          SET name = ?, description = ?, template_type = ?, is_active = ?, is_default = ?, 
              template_data = ?, background_image_path = ?, template_file_path = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        
        stmt.run([
          name,
          description || null,
          template_type || 'custom',
          is_active !== undefined ? is_active : 1,
          is_default || 0,
          template_data ? JSON.stringify(template_data) : null,
          background_image_path || null,
          template_file_path || null,
          id
        ], function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('Template not found'));
          } else {
            resolve({ id, ...templateData });
          }
        });
        
        stmt.finalize();
      }
    });
  }

  static async delete(id) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      // Check if this is the default template
      db.get('SELECT is_default FROM receipt_templates WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          reject(new Error('Template not found'));
          return;
        }
        
        if (row.is_default) {
          reject(new Error('Cannot delete the default template'));
          return;
        }
        
        // Delete the template
        db.run('DELETE FROM receipt_templates WHERE id = ?', [id], function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('Template not found'));
          } else {
            resolve({ message: 'Template deleted successfully' });
          }
        });
      });
    });
  }

  static async setDefault(id) {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      // First, unset all defaults
      db.run('UPDATE receipt_templates SET is_default = 0', (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Then set the specified template as default
        db.run('UPDATE receipt_templates SET is_default = 1 WHERE id = ?', [id], function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('Template not found'));
          } else {
            resolve({ message: 'Default template updated successfully' });
          }
        });
      });
    });
  }
}

module.exports = Template;
