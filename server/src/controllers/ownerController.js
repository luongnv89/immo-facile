const Owner = require('../models/Owner');

const path = require('path');
const fs = require('fs');
const { assertInsideDir } = require('../utils/pathSafety');
const { ValidationError, NotFoundError } = require('../utils/errors');

const ownerController = {
  // Get owner information
  getOwner: async (req, res) => {
    const owner = await Owner.getOwner();

    if (!owner) {
      throw new NotFoundError('Owner not found');
    }

    res.json({
      success: true,
      data: owner,
    });
  },

  // Update owner information
  updateOwner: async (req, res) => {
    const { name, address1, address2, signature, signature_path } = req.body;

    // Validation
    if (!name || !address1) {
      throw new ValidationError('Name and address1 are required');
    }

    // Task 1.2 (#17): signature_path must stay inside the uploads dir
    if (signature_path) {
      try {
        assertInsideDir(signature_path, process.env.UPLOADS_DIR || './uploads');
      } catch {
        throw new ValidationError('signature_path must point inside the uploads directory');
      }
    }

    const updatedOwner = await Owner.updateOwner({
      name,
      address1,
      address2,
      signature,
      signature_path,
    });

    res.json({
      success: true,
      message: 'Owner information updated successfully',
      data: updatedOwner,
    });
  },

  // Create owner (if none exists)
  createOwner: async (req, res) => {
    const { name, address1, address2, signature, signature_path } = req.body;

    // Validation
    if (!name || !address1) {
      throw new ValidationError('Name and address1 are required');
    }

    // Task 1.2 (#17): signature_path must stay inside the uploads dir
    if (signature_path) {
      try {
        assertInsideDir(signature_path, process.env.UPLOADS_DIR || './uploads');
      } catch {
        throw new ValidationError('signature_path must point inside the uploads directory');
      }
    }

    const newOwner = await Owner.createOwner({
      name,
      address1,
      address2,
      signature,
      signature_path,
    });

    res.status(201).json({
      success: true,
      message: 'Owner created successfully',
      data: newOwner,
    });
  },

  // Upload signature image
  uploadSignature: async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No signature file uploaded');
    }

    const signaturePath = req.file.path;
    const owner = await Owner.getOwner();

    if (!owner) {
      throw new NotFoundError('Owner not found');
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
      signature_path: signaturePath,
    });

    res.json({
      success: true,
      message: 'Signature uploaded successfully',
      data: updatedOwner,
    });
  },

  // Get signature image as base64
  getSignatureImage: async (req, res) => {
    const owner = await Owner.getOwner();

    if (!owner || !owner.signature_path) {
      throw new NotFoundError('No signature image found');
    }

    // Check if file exists
    if (!fs.existsSync(owner.signature_path)) {
      throw new NotFoundError('Signature file not found');
    }

    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(owner.signature_path);
    const base64Image = fileBuffer.toString('base64');

    // Get file extension to set proper content type
    const ext = path.extname(owner.signature_path).toLowerCase();
    const mimeType =
      {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      }[ext] || 'image/png';

    res.json({
      success: true,
      data: {
        image: `data:${mimeType};base64,${base64Image}`,
        filename: path.basename(owner.signature_path),
        mimeType: mimeType,
      },
    });
  },
};

module.exports = ownerController;
