// controllers/uploadController.js
const { cloudinary } = require('../config/cloudinary');

// @desc    Upload image to Cloudinary
// @route   POST /api/upload-photo
// @access  Public
const uploadPhoto = async (req, res) => {
  try {
    const fileStr = req.body.photo;
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      upload_preset: 'checkin-app'
    });
    
    res.json({ url: uploadResponse.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed' });
  }
};

module.exports = {
  uploadPhoto
};