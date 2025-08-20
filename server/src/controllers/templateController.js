const Template = require('../models/Template');
const TemplateAnalyzer = require('../utils/templateAnalyzer');
const fs = require('fs');
const path = require('path');

const templateController = {
  // Get all templates
  async getAllTemplates(req, res) {
    try {
      const templates = await Template.findAll();
      res.json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch templates',
        message: error.message
      });
    }
  },

  // Get template by ID
  async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const template = await Template.findById(id);
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch template',
        message: error.message
      });
    }
  },

  // Get default template
  async getDefaultTemplate(req, res) {
    try {
      const template = await Template.findDefault();
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching default template:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'No default template found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch default template',
        message: error.message
      });
    }
  },

  // Create new template
  async createTemplate(req, res) {
    try {
      const templateData = req.body;
      
      // Validation
      if (!templateData.name) {
        return res.status(400).json({
          success: false,
          error: 'Template name is required'
        });
      }

      // Handle file uploads
      if (req.files) {
        if (req.files.templateFile && req.files.templateFile[0]) {
          templateData.template_file_path = req.files.templateFile[0].path;
          
          // Analyze uploaded template and generate configuration
          try {
            const templateConfig = await TemplateAnalyzer.analyzeTemplate(
              req.files.templateFile[0].path,
              {
                name: templateData.name,
                template_type: templateData.template_type,
                filePath: req.files.templateFile[0].path
              }
            );
            templateData.template_data = templateConfig;
          } catch (error) {
            console.warn('Template analysis failed, using default configuration:', error);
            // Use a basic configuration if analysis fails
            templateData.template_data = TemplateAnalyzer.createSmartConfiguration({
              style: 'standard',
              includeBackground: true,
              backgroundPath: req.files.templateFile[0].path
            });
          }
        }
        if (req.files.background && req.files.background[0]) {
          templateData.background_image_path = req.files.background[0].path;
        }
      }

      const template = await Template.create(templateData);
      
      res.status(201).json({
        success: true,
        data: template,
        message: 'Template created successfully'
      });
    } catch (error) {
      console.error('Error creating template:', error);
      
      // Clean up uploaded files if template creation failed
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (cleanupError) {
              console.warn('Could not clean up uploaded file:', cleanupError);
            }
          }
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to create template',
        message: error.message
      });
    }
  },

  // Update template
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const templateData = req.body;
      
      // Validation
      if (!templateData.name) {
        return res.status(400).json({
          success: false,
          error: 'Template name is required'
        });
      }

      // Handle file uploads
      if (req.files) {
        if (req.files.templateFile && req.files.templateFile[0]) {
          templateData.template_file_path = req.files.templateFile[0].path;
          
          // Analyze uploaded template and generate configuration
          try {
            const templateConfig = await TemplateAnalyzer.analyzeTemplate(
              req.files.templateFile[0].path,
              {
                name: templateData.name,
                template_type: templateData.template_type,
                filePath: req.files.templateFile[0].path
              }
            );
            templateData.template_data = templateConfig;
          } catch (error) {
            console.warn('Template analysis failed, using default configuration:', error);
            // Use a basic configuration if analysis fails
            templateData.template_data = TemplateAnalyzer.createSmartConfiguration({
              style: 'standard',
              includeBackground: true,
              backgroundPath: req.files.templateFile[0].path
            });
          }
        }
        if (req.files.background && req.files.background[0]) {
          templateData.background_image_path = req.files.background[0].path;
        }
      }

      const template = await Template.update(id, templateData);
      
      res.json({
        success: true,
        data: template,
        message: 'Template updated successfully'
      });
    } catch (error) {
      console.error('Error updating template:', error);
      
      // Clean up uploaded files if template update failed
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (cleanupError) {
              console.warn('Could not clean up uploaded file:', cleanupError);
            }
          }
        });
      }
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to update template',
        message: error.message
      });
    }
  },

  // Delete template
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      
      // Get template info before deletion to clean up files
      let template;
      try {
        template = await Template.findById(id);
      } catch (error) {
        // Template not found
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      // Delete associated background image if exists
      if (template.background_image_path && fs.existsSync(template.background_image_path)) {
        try {
          fs.unlinkSync(template.background_image_path);
        } catch (fileError) {
          console.warn('Could not delete background image file:', fileError);
        }
      }
      
      await Template.delete(id);
      
      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      if (error.message.includes('Cannot delete the default template')) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the default template'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete template',
        message: error.message
      });
    }
  },

  // Set template as default
  async setDefaultTemplate(req, res) {
    try {
      const { id } = req.params;
      
      await Template.setDefault(id);
      
      res.json({
        success: true,
        message: 'Default template updated successfully'
      });
    } catch (error) {
      console.error('Error setting default template:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to set default template',
        message: error.message
      });
    }
  },

  // Upload background image for template
  async uploadBackground(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const { id } = req.params;
      const backgroundPath = req.file.path;
      
      // Update template with background image path
      const template = await Template.findById(id);
      const updatedTemplate = await Template.update(id, {
        ...template,
        background_image_path: backgroundPath
      });
      
      res.json({
        success: true,
        data: updatedTemplate,
        message: 'Background image uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading background:', error);
      
      // Clean up uploaded file if template update failed
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.warn('Could not clean up uploaded file:', cleanupError);
        }
      }
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to upload background image',
        message: error.message
      });
    }
  }
};

module.exports = templateController;
