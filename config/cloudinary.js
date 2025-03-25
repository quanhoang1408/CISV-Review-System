// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Simple function to verify config is loaded correctly
const verifyConfig = () => {
  console.log('Cloudinary Configuration:');
  console.log('- Cloud name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set ✓' : 'Missing ✗');
  console.log('- API key:', process.env.CLOUDINARY_API_KEY ? 'Set ✓' : 'Missing ✗');
  console.log('- API secret:', process.env.CLOUDINARY_API_SECRET ? 'Set ✓' : 'Missing ✗');
};

// Call this when server starts
verifyConfig();

module.exports = { cloudinary };