// routes/googleSheetsRoutes.js
const express = require('express');
const router = express.Router();
const { updateEvaluationSheet } = require('../controllers/googleSheetsController');

router.post('/update-evaluation', updateEvaluationSheet);

module.exports = router;
