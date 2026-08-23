const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const upload = require('../middleware/upload');
const fs = require('fs/promises');
const { extensionAllowed, hasImageMagicBytes } = require('../utils/uploadValidation');

// GET /api/owner - Get owner information
router.get('/', ownerController.getOwner);

// PUT /api/owner - Update owner information
router.put('/', ownerController.updateOwner);

// POST /api/owner - Create owner (if none exists)
router.post('/', ownerController.createOwner);

/**
 * Verify extension allowlist + magic bytes, not just the client-declared
 * MIME type. Async fs so the event loop is never blocked (#57); a rejected
 * upload removes the temp file before responding.
 */
const validateSignatureUpload = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  if (!extensionAllowed(req.file.originalname)) {
    await fs.unlink(req.file.path);
    return res.status(400).json({ success: false, message: 'Extension not allowed' });
  }
  const fd = await fs.open(req.file.path, 'r');
  try {
    const buf = Buffer.alloc(16);
    await fd.read(buf, 0, 16, 0);
    if (!hasImageMagicBytes(buf)) {
      await fs.unlink(req.file.path);
      return res
        .status(400)
        .json({ success: false, message: 'File content is not a supported image' });
    }
  } finally {
    await fd.close();
  }
  return next();
};

// POST /api/owner/signature - Upload signature image
router.post(
  '/signature',
  upload.single('signature'),
  validateSignatureUpload,
  ownerController.uploadSignature
);

// GET /api/owner/signature - Get signature image
router.get('/signature', ownerController.getSignatureImage);

module.exports = router;
