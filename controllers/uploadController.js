// controllers/uploadController.js
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

// @desc    Upload image to Cloudinary from data URL (base64)
// @route   POST /api/upload-photo
// @access  Public
const uploadPhoto = async (req, res) => {
  try {
    console.log('Received base64 upload request');
    const fileStr = req.body.photo;
    
    if (!fileStr) {
      return res.status(400).json({ message: 'No image data provided in request body' });
    }
    
    console.log('Uploading base64 image to Cloudinary...');
    
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: 'checkin-app',
      resource_type: 'auto'
    });
    
    console.log('Base64 upload successful:', uploadResponse.secure_url);
    res.json({ url: uploadResponse.secure_url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Upload failed', 
      error: error.message
    });
  }
};

// @desc    Upload image file to Cloudinary
// @route   POST /api/upload-photo/file
// @access  Public
const uploadPhotoFile = async (req, res) => {
  try {
    console.log('Received file upload request');
    console.log('req.file:', req.file);
    
    // Check if file was received
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or file field is not named "photo"' });
    }
    
    console.log('File details:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      path: req.file.path,
      size: req.file.size
    });
    
    try {
      // Check if file exists at the path
      fs.accessSync(req.file.path, fs.constants.F_OK);
      console.log('File exists at path:', req.file.path);
    } catch (err) {
      console.error('File not found at path:', req.file.path);
      return res.status(400).json({ message: 'File not found at path: ' + req.file.path });
    }
    
    console.log('Uploading file to Cloudinary...');
    
    // Upload to Cloudinary using streams to avoid "missing file" errors
    const stream = fs.createReadStream(req.file.path);
    
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'checkin-app',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      
      stream.pipe(uploadStream);
    });
    
    const result = await uploadPromise;
    
    console.log('File upload successful:', result.secure_url);
    
    // Clean up the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
      else console.log('Temporary file deleted');
    });
    
    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Upload error details:', error);
    
    // Clean up temp file if it exists
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    
    res.status(500).json({ 
      message: `Upload failed: ${error.message}`,
      details: error
    });
  }
};

module.exports = {
  uploadPhoto,
  uploadPhotoFile
};