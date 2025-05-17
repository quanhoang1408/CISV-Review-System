// controllers/evaluationController.js
const Evaluation = require('../models/Evaluation');

// @desc    Get evaluations by participant
// @route   GET /api/evaluations/:participantId
// @access  Public
const getEvaluationsByParticipant = async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ participantId: req.params.participantId })
      .populate('evaluatorId', 'name');
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an evaluation
// @route   POST /api/evaluations
// @access  Public
const createEvaluation = async (req, res) => {
  try {
    const { participantId, evaluatorId, criteria } = req.body;

    const evaluation = new Evaluation({
      participantId,
      evaluatorId,
      criteria
    });

    const savedEvaluation = await evaluation.save();
    res.status(201).json(savedEvaluation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an evaluation
// @route   DELETE /api/evaluations/:id
// @access  Public (should be restricted to super admin in frontend)
const deleteEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({ message: 'Đánh giá không tồn tại' });
    }

    await Evaluation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Đã xóa đánh giá thành công',
      evaluationId: req.params.id
    });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEvaluationsByParticipant,
  createEvaluation,
  deleteEvaluation
};