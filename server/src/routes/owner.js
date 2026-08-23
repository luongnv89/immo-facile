const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const upload = require('../middleware/upload');
const fs = require('fs');
const { extensionAllowed, hasImageMagicBytes } = require('../utils/uploadValidation');

// GET /api/owner - Get owner information
router.get('/', ownerController.getOwner);

// PUT /api/owner - Update owner information
router.put('/', ownerController.updateOwner);

// POST /api/owner - Create owner (if none exists)
router.post('/', ownerController.createOwner);

// POST /api/owner/signature - Upload signature image
// Task 4.6 (#42): verify extension allowlist + magic bytes, not just the
// client-declared MIME type.
router.post(
  '/signature',
  upload.single('signature'),
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    if (!extensionAllowed(req.file.originalname)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Extension not allowed' });
    }
    const fd = fs.openSync(req.file.path, 'r');
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    fs.closeSync(fd);
    if (!hasImageMagicBytes(buf)) {
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({ success: false, message: 'File content is not a supported image' });
    }
    return next();
  },
  ownerController.uploadSignature
);

// GET /api/owner/signature - Get signature image
router.get('/signature', ownerController.getSignatureImage);

module.exports = router;
