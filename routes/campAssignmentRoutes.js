// routes/campAssignmentRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getCampAssignments, 
  updateCampAssignment,
  deleteCampAssignment,
  updateAssignmentOrder
} = require('../controllers/campAssignmentController');

router.get('/', getCampAssignments);
router.post('/', updateCampAssignment);
router.delete('/:id', deleteCampAssignment);
router.post('/order', updateAssignmentOrder); // Thêm route mới

module.exports = router;