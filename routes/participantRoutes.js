// routes/participantRoutes.js
const express = require('express');
const router = express.Router();
const {
  getParticipants,
  createParticipant,
  checkInParticipant,
  resetCheckIn,
  findParticipantByName,
  deleteParticipant,
  updateParticipant
} = require('../controllers/participantController');

router.get('/', getParticipants);
router.post('/', createParticipant);
router.put('/:id/checkin', checkInParticipant);
router.put('/:id/reset-checkin', resetCheckIn);
router.get('/find-by-name', findParticipantByName);
router.delete('/:id', deleteParticipant);
router.put('/:id', updateParticipant);

module.exports = router;