const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const upload = require('../middleware/upload');

// GET /api/owner - Get owner information
router.get('/', ownerController.getOwner);

// PUT /api/owner - Update owner information
router.put('/', ownerController.updateOwner);

// POST /api/owner - Create owner (if none exists)
router.post('/', ownerController.createOwner);

// POST /api/owner/signature - Upload signature image
router.post('/signature', upload.single('signature'), ownerController.uploadSignature);

// GET /api/owner/signature - Get signature image
router.get('/signature', ownerController.getSignatureImage);

module.exports = router;
