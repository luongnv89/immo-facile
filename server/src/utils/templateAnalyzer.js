const fs = require('fs');
const path = require('path');

class TemplateAnalyzer {
  /**
   * Analyzes an uploaded template file and generates a template configuration
   * @param {string} templateFilePath - Path to the uploaded template file
   * @param {Object} templateInfo - Basic template information
   * @returns {Object} Generated template configuration
   */
  static async analyzeTemplate(templateFilePath, templateInfo = {}) {
    const fileExtension = path.extname(templateFilePath).toLowerCase();
    
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(fileExtension)) {
      return this.analyzeImageTemplate(templateFilePath, templateInfo);
    } else if (fileExtension === '.pdf') {
      return this.analyzePdfTemplate(templateFilePath, templateInfo);
    } else {
      throw new Error('Unsupported template file type');
    }
  }

  /**
   * Analyzes an image template and creates a configuration
   * @param {string} imagePath - Path to the image template
   * @param {Object} templateInfo - Basic template information
   * @returns {Object} Template configuration
   */
  static async analyzeImageTemplate(imagePath, templateInfo) {
    // For image templates, we'll create a smart layout based on common receipt patterns
    // This could be enhanced with actual image analysis/OCR in the future
    
    const config = {
      layout: {
        margin: 50,
        pageSize: 'A4',
        useBackgroundImage: false,
        backgroundImagePath: null
      },
      // Smart positioning based on typical receipt layouts
      header: {
        title: 'Receipt',
        fontSize: 16,
        fontStyle: 'bold',
        position: { x: 50, y: 80 },
        align: 'center',
        color: '#000000'
      },
      landlordInfo: {
        position: { x: 70, y: 130 },
        fontSize: 10,
        color: '#000000'
      },
      tenantInfo: {
        position: { x: 350, y: 175 },
        fontSize: 10,
        color: '#000000'
      },
      propertyAddress: {
        position: { x: 70, y: 240 },
        fontSize: 11,
        fontStyle: 'bold',
        color: '#000000'
      },
      mainText: {
        position: { x: 70, y: 280 },
        fontSize: 11,
        color: '#000000',
        lineHeight: 15
      },
      paymentDetails: {
        position: { x: 70, y: 380 },
        fontSize: 11,
        color: '#000000',
        tableStyle: {
          columnWidths: [130, 100],
          rowHeight: 20
        }
      },
      signature: {
        position: { x: 70, y: 500 },
        fontSize: 11,
        color: '#000000'
      },
      footer: {
        position: { x: 70, y: 580 },
        fontSize: 9,
        color: '#666666'
      }
    };

    // Enhance with template-specific adjustments
    return this.enhanceConfigurationForTemplate(config, templateInfo);
  }

  /**
   * Analyzes a PDF template and creates a configuration
   * @param {string} pdfPath - Path to the PDF template
   * @param {Object} templateInfo - Basic template information
   * @returns {Object} Template configuration
   */
  static async analyzePdfTemplate(pdfPath, templateInfo) {
    // For PDF templates, we'll create a configuration that works well with PDF backgrounds
    // This could be enhanced with PDF parsing in the future
    
    const config = {
      layout: {
        margin: 50,
        pageSize: 'A4',
        usePdfBackground: false,
        backgroundPdfPath: null
      },
      // Conservative positioning for PDF backgrounds
      header: {
        title: 'Receipt',
        fontSize: 14,
        fontStyle: 'bold',
        position: { x: 50, y: 100 },
        align: 'center',
        color: '#000000',
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      },
      landlordInfo: {
        position: { x: 80, y: 150 },
        fontSize: 9,
        color: '#000000',
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      },
      tenantInfo: {
        position: { x: 320, y: 190 },
        fontSize: 9,
        color: '#000000',
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      },
      propertyAddress: {
        position: { x: 80, y: 260 },
        fontSize: 10,
        fontStyle: 'bold',
        color: '#000000',
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      },
      mainText: {
        position: { x: 80, y: 300 },
        fontSize: 10,
        color: '#000000',
        lineHeight: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      },
      paymentDetails: {
        position: { x: 80, y: 400 },
        fontSize: 10,
        color: '#000000',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        tableStyle: {
          columnWidths: [120, 90],
          rowHeight: 18
        }
      },
      signature: {
        position: { x: 80, y: 520 },
        fontSize: 10,
        color: '#000000',
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      },
      footer: {
        position: { x: 80, y: 600 },
        fontSize: 8,
        color: '#666666',
        backgroundColor: 'rgba(255, 255, 255, 0.7)'
      }
    };

    return this.enhanceConfigurationForTemplate(config, templateInfo);
  }

  /**
   * Enhances the base configuration with template-specific adjustments
   * @param {Object} config - Base configuration
   * @param {Object} templateInfo - Template information
   * @returns {Object} Enhanced configuration
   */
  static enhanceConfigurationForTemplate(config, templateInfo) {
    // Apply template-specific enhancements based on template type or name
    if (templateInfo.name) {
      const nameLower = templateInfo.name.toLowerCase();
      
      // Adjust for different template styles
      if (nameLower.includes('modern') || nameLower.includes('minimal')) {
        config.header.fontSize = 18;
        config.layout.margin = 60;
      } else if (nameLower.includes('classic') || nameLower.includes('traditional')) {
        config.header.fontSize = 16;
        config.layout.margin = 40;
      } else if (nameLower.includes('compact')) {
        // Adjust for compact layouts
        Object.keys(config).forEach(key => {
          if (config[key].position) {
            config[key].position.y -= 20;
          }
          if (config[key].fontSize) {
            config[key].fontSize = Math.max(8, config[key].fontSize - 1);
          }
        });
      }
    }

    // Add metadata
    config.metadata = {
      generatedFrom: 'uploaded_template',
      analysisDate: new Date().toISOString(),
      templateType: templateInfo.template_type || 'uploaded',
      originalFile: path.basename(templateInfo.filePath || '')
    };

    return config;
  }

  /**
   * Generates positioning suggestions based on image analysis
   * This is a placeholder for future OCR/image analysis integration
   * @param {string} imagePath - Path to the image
   * @returns {Object} Positioning suggestions
   */
  static async analyzeImageLayout(imagePath) {
    // Placeholder for future image analysis
    // Could integrate with libraries like:
    // - Tesseract.js for OCR
    // - Sharp for image analysis
    // - OpenCV for layout detection
    
    return {
      detectedRegions: [],
      suggestedPositions: {},
      confidence: 0.5
    };
  }

  /**
   * Creates a smart template configuration based on common receipt patterns
   * @param {Object} options - Configuration options
   * @returns {Object} Smart template configuration
   */
  static createSmartConfiguration(options = {}) {
    const {
      style = 'standard',
      language = 'en',
      includeBackground = false,
      backgroundPath = null
    } = options;

    const baseConfig = {
      layout: {
        margin: 50,
        pageSize: 'A4'
      }
    };

    if (includeBackground && backgroundPath) {
      baseConfig.layout.useBackgroundImage = true;
      baseConfig.layout.backgroundImagePath = backgroundPath;
    }

    // Add style-specific configurations
    switch (style) {
      case 'modern':
        return this.applyModernStyle(baseConfig);
      case 'classic':
        return this.applyClassicStyle(baseConfig);
      case 'minimal':
        return this.applyMinimalStyle(baseConfig);
      default:
        return this.applyStandardStyle(baseConfig);
    }
  }

  static applyStandardStyle(config) {
    return {
      ...config,
      header: {
        title: 'Receipt',
        fontSize: 16,
        fontStyle: 'bold',
        position: { x: 50, y: 80 },
        align: 'center'
      },
      landlordInfo: {
        position: { x: 70, y: 130 },
        fontSize: 10
      },
      tenantInfo: {
        position: { x: 350, y: 175 },
        fontSize: 10
      },
      propertyAddress: {
        position: { x: 70, y: 240 },
        fontSize: 11,
        fontStyle: 'bold'
      },
      mainText: {
        position: { x: 70, y: 280 },
        fontSize: 11
      },
      paymentDetails: {
        position: { x: 70, y: 380 },
        fontSize: 11
      },
      signature: {
        position: { x: 70, y: 500 }
      },
      footer: {
        position: { x: 70, y: 580 },
        fontSize: 9
      }
    };
  }

  static applyModernStyle(config) {
    const standard = this.applyStandardStyle(config);
    return {
      ...standard,
      header: {
        ...standard.header,
        fontSize: 20,
        color: '#2563eb'
      },
      layout: {
        ...standard.layout,
        margin: 60
      }
    };
  }

  static applyClassicStyle(config) {
    const standard = this.applyStandardStyle(config);
    return {
      ...standard,
      header: {
        ...standard.header,
        fontSize: 18,
        fontStyle: 'bold'
      },
      layout: {
        ...standard.layout,
        margin: 40
      }
    };
  }

  static applyMinimalStyle(config) {
    const standard = this.applyStandardStyle(config);
    return {
      ...standard,
      header: {
        ...standard.header,
        fontSize: 14,
        fontStyle: 'normal'
      },
      layout: {
        ...standard.layout,
        margin: 70
      }
    };
  }
}

module.exports = TemplateAnalyzer;
