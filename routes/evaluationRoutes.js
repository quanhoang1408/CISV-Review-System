// routes/evaluationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getEvaluationsByParticipant, 
  createEvaluation 
} = require('../controllers/evaluationController');

router.get('/:participantId', getEvaluationsByParticipant);
router.post('/', createEvaluation);

module.exports = router;