// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadPhoto, uploadPhotoFile } = require('../controllers/uploadController');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory at:', uploadDir);
}

// SIMPLIFIED MULTER CONFIGURATION - this is key
const upload = multer({
  dest: uploadDir,
  // Don't use diskStorage for now - use the default storage
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Keep the debug endpoint
router.post('/debug-file', (req, res) => {
  console.log('==== DEBUG UPLOAD REQUEST ====');
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body keys:', Object.keys(req.body));
  
  console.log('Files attached to request:', req.files);
  console.log('Single file attached:', req.file);
  
  let rawData = '';
  req.on('data', chunk => {
    rawData += chunk;
    console.log('Received data chunk, length:', chunk.length);
  });
  
  req.on('end', () => {
    console.log('Raw request size:', rawData.length, 'bytes');
    console.log('First 200 chars of raw data:', rawData.substring(0, 200));
    
    res.json({
      receivedHeaders: req.headers,
      contentType: req.headers['content-type'],
      bodyKeys: Object.keys(req.body),
      hasFiles: !!req.files,
      hasFile: !!req.file,
      rawDataSize: rawData.length
    });
  });
});

// Base64 image upload route
router.post('/', uploadPhoto);

// SIMPLIFIED FILE UPLOAD ROUTE
router.post('/file', upload.single('photo'), uploadPhotoFile);

module.exports = router;