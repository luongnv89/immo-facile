const Owner = require('../models/Owner');

const path = require('path');
const fs = require('fs');

const ownerController = {
  // Get owner information
  getOwner: async (req, res) => {
    try {
      const owner = await Owner.getOwner();
      
      if (!owner) {
        return res.status(404).json({
          success: false,
          message: 'Owner not found'
        });
      }

      res.json({
        success: true,
        data: owner
      });
    } catch (error) {
      console.error('Error getting owner:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get owner information',
        error: error.message
      });
    }
  },

  // Update owner information
  updateOwner: async (req, res) => {
    try {
      const { name, address1, address2, signature, signature_path } = req.body;

      // Validation
      if (!name || !address1) {
        return res.status(400).json({
          success: false,
          message: 'Name and address1 are required'
        });
      }

      const updatedOwner = await Owner.updateOwner({
        name,
        address1,
        address2,
        signature,
        signature_path
      });

      res.json({
        success: true,
        message: 'Owner information updated successfully',
        data: updatedOwner
      });
    } catch (error) {
      console.error('Error updating owner:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update owner information',
        error: error.message
      });
    }
  },

  // Create owner (if none exists)
  createOwner: async (req, res) => {
    try {
      const { name, address1, address2, signature, signature_path } = req.body;

      // Validation
      if (!name || !address1) {
        return res.status(400).json({
          success: false,
          message: 'Name and address1 are required'
        });
      }

      const newOwner = await Owner.createOwner({
        name,
        address1,
        address2,
        signature,
        signature_path
      });

      res.status(201).json({
        success: true,
        message: 'Owner created successfully',
        data: newOwner
      });
    } catch (error) {
      console.error('Error creating owner:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create owner',
        error: error.message
      });
    }
  },

  // Upload signature image
  uploadSignature: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No signature file uploaded'
        });
      }

      const signaturePath = req.file.path;
      const owner = await Owner.getOwner();

      if (!owner) {
        return res.status(404).json({
          success: false,
          message: 'Owner not found'
        });
      }

      // Delete old signature file if it exists
      if (owner.signature_path && fs.existsSync(owner.signature_path)) {
        try {
          fs.unlinkSync(owner.signature_path);
        } catch (error) {
          console.warn('Could not delete old signature file:', error.message);
        }
      }

      // Update owner with new signature path
      const updatedOwner = await Owner.updateOwner({
        name: owner.name,
        address1: owner.address1,
        address2: owner.address2,
        signature: owner.signature,
        signature_path: signaturePath
      });

      res.json({
        success: true,
        message: 'Signature uploaded successfully',
        data: updatedOwner
      });
    } catch (error) {
      console.error('Error uploading signature:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload signature',
        error: error.message
      });
    }
  },

  // Get signature image as base64
  getSignatureImage: async (req, res) => {
    try {
      const owner = await Owner.getOwner();
      
      if (!owner || !owner.signature_path) {
        return res.status(404).json({
          success: false,
          message: 'No signature image found'
        });
      }

      // Check if file exists
      if (!fs.existsSync(owner.signature_path)) {
        return res.status(404).json({
          success: false,
          message: 'Signature file not found'
        });
      }

      // Read file and convert to base64
      const fileBuffer = fs.readFileSync(owner.signature_path);
      const base64Image = fileBuffer.toString('base64');
      
      // Get file extension to set proper content type
      const ext = path.extname(owner.signature_path).toLowerCase();
      const mimeType = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      }[ext] || 'image/png';

      res.json({
        success: true,
        data: {
          image: `data:${mimeType};base64,${base64Image}`,
          filename: path.basename(owner.signature_path),
          mimeType: mimeType
        }
      });
    } catch (error) {
      console.error('Error getting signature image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get signature image',
        error: error.message
      });
    }
  }
};

module.exports = ownerController;
