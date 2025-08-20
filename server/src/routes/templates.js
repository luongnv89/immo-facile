const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const templateController = require('../controllers/templateController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/templates';
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'templateFile' ? 'template-file-' : 'template-bg-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs for template files, images only for backgrounds
  if (file.fieldname === 'templateFile') {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed for template files'), false);
    }
  } else if (file.fieldname === 'background') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for backgrounds'), false);
    }
  } else {
    cb(new Error('Invalid field name'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for template files
  }
});

// Routes
router.get('/', templateController.getAllTemplates);
router.get('/default', templateController.getDefaultTemplate);
router.get('/:id', templateController.getTemplateById);
router.post('/', upload.fields([
  { name: 'templateFile', maxCount: 1 },
  { name: 'background', maxCount: 1 }
]), templateController.createTemplate);
router.put('/:id', upload.fields([
  { name: 'templateFile', maxCount: 1 },
  { name: 'background', maxCount: 1 }
]), templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);
router.post('/:id/set-default', templateController.setDefaultTemplate);
router.post('/:id/upload-background', upload.single('background'), templateController.uploadBackground);

module.exports = router;
