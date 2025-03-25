// routes/participantRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getParticipants, 
  createParticipant, 
  checkInParticipant 
} = require('../controllers/participantController');

router.get('/', getParticipants);
router.post('/', createParticipant);
router.put('/:id/checkin', checkInParticipant);

module.exports = router;