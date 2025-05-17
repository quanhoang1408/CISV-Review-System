// routes/evaluationRoutes.js
const express = require('express');
const router = express.Router();
const {
  getEvaluationsByParticipant,
  createEvaluation,
  deleteEvaluation
} = require('../controllers/evaluationController');

router.get('/:participantId', getEvaluationsByParticipant);
router.post('/', createEvaluation);
router.delete('/:id', deleteEvaluation);

module.exports = router;