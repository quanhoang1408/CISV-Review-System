// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { uploadPhoto } = require('../controllers/uploadController');

router.post('/', uploadPhoto);

module.exports = router;