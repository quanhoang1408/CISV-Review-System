// controllers/adminToolsController.js
const { exec } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Định nghĩa schema cho Evaluation
const criterionSchema = new mongoose.Schema({
  name: String,
  score: Number,
  evidence: String
});

const evaluationSchema = new mongoose.Schema({
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true
  },
  evaluatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  criteria: [criterionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

// @desc    Update evaluatorId in evaluations
// @route   POST /api/admin-tools/update-evaluator-id
// @access  Public (should be restricted to super admin in frontend)
const updateEvaluatorId = async (req, res) => {
  try {
    const { oldEvaluatorId, newEvaluatorId } = req.body;
    
    // Validate input
    if (!oldEvaluatorId || !newEvaluatorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both oldEvaluatorId and newEvaluatorId are required'
      });
    }
    
    // Validate ObjectId format
    if (!ObjectId.isValid(oldEvaluatorId) || !ObjectId.isValid(newEvaluatorId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ObjectId format'
      });
    }
    
    console.log(`Updating evaluations with evaluatorId ${oldEvaluatorId} to ${newEvaluatorId}`);
    
    // Find evaluations with old evaluatorId
    const evaluationsToUpdate = await Evaluation.find({
      evaluatorId: new ObjectId(oldEvaluatorId)
    });
    
    console.log(`Found ${evaluationsToUpdate.length} evaluations to update`);
    
    // Update evaluations
    const updateResult = await Evaluation.updateMany(
      { evaluatorId: new ObjectId(oldEvaluatorId) },
      { $set: { evaluatorId: new ObjectId(newEvaluatorId) } }
    );
    
    res.json({ 
      success: true, 
      message: 'Evaluator ID updated successfully',
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('Error updating evaluator ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating evaluator ID',
      error: error.message
    });
  }
};

// @desc    Run update evaluator ID script
// @route   POST /api/admin-tools/run-update-evaluator-script
// @access  Public (should be restricted to super admin in frontend)
const runUpdateEvaluatorScript = async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '../scripts/updateEvaluatorId.js');
    
    // Execute the script
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        return res.status(500).json({ 
          success: false, 
          message: 'Error running update evaluator script',
          error: error.message
        });
      }
      
      if (stderr) {
        console.error(`Script stderr: ${stderr}`);
      }
      
      console.log(`Script output: ${stdout}`);
      
      res.json({ 
        success: true, 
        message: 'Update evaluator script executed successfully',
        output: stdout
      });
    });
  } catch (error) {
    console.error('Error running update evaluator script:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error running update evaluator script',
      error: error.message
    });
  }
};

module.exports = {
  updateEvaluatorId,
  runUpdateEvaluatorScript
};
