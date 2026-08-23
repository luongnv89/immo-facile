const Owner = require('../models/Owner');

const path = require('path');
const fs = require('fs/promises');
const { assertInsideDir } = require('../utils/pathSafety');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * In-memory cache of the rendered signature data-URI (#57).
 * Keyed by file path + mtimeMs so a re-upload or edit invalidates it
 * for free; an upload clears it explicitly. Avoids a disk read plus
 * base64 encode on every Owner page load.
 */
let signatureCache = { filePath: null, mtimeMs: null, payload: null };

const clearSignatureCache = () => {
  signatureCache = { filePath: null, mtimeMs: null, payload: null };
};

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

    // signature_path must stay inside the uploads dir
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

    // signature_path must stay inside the uploads dir
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
    if (owner.signature_path) {
      try {
        await fs.unlink(owner.signature_path);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn('Could not delete old signature file:', error.message);
        }
      }
    }

    clearSignatureCache();

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

  // Get signature image as base64 (mtime-keyed cache, #57)
  getSignatureImage: async (req, res) => {
    const owner = await Owner.getOwner();

    if (!owner || !owner.signature_path) {
      throw new NotFoundError('No signature image found');
    }

    let stats;
    try {
      stats = await fs.stat(owner.signature_path);
    } catch {
      clearSignatureCache();
      throw new NotFoundError('Signature file not found');
    }

    // Serve the cached data-URI when the file has not changed
    if (
      signatureCache.filePath === owner.signature_path &&
      signatureCache.mtimeMs === stats.mtimeMs
    ) {
      return res.json(signatureCache.payload);
    }

    // Read file and convert to base64
    const fileBuffer = await fs.readFile(owner.signature_path);
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

    const payload = {
      success: true,
      data: {
        image: `data:${mimeType};base64,${base64Image}`,
        filename: path.basename(owner.signature_path),
        mimeType: mimeType,
      },
    };

    signatureCache = {
      filePath: owner.signature_path,
      mtimeMs: stats.mtimeMs,
      payload,
    };

    res.json(payload);
  },
};

module.exports = ownerController;
