// routes/campAssignmentRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getCampAssignments, 
  updateCampAssignment,
  deleteCampAssignment
} = require('../controllers/campAssignmentController');

router.get('/', getCampAssignments);
router.post('/', updateCampAssignment);
router.delete('/:id', deleteCampAssignment);

module.exports = router;