// controllers/googleSheetsController.js
const { exec } = require('child_process');
const path = require('path');

// @desc    Update evaluation sheet
// @route   POST /api/sheets/update-evaluation
// @access  Public (should be restricted to admin in frontend)
const updateEvaluationSheet = async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '../scripts/updateEvaluationSheet.js');
    
    // Execute the script
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        return res.status(500).json({ 
          success: false, 
          message: 'Error updating evaluation sheet',
          error: error.message
        });
      }
      
      if (stderr) {
        console.error(`Script stderr: ${stderr}`);
      }
      
      console.log(`Script output: ${stdout}`);
      
      res.json({ 
        success: true, 
        message: 'Evaluation sheet updated successfully',
        output: stdout
      });
    });
  } catch (error) {
    console.error('Error updating evaluation sheet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating evaluation sheet',
      error: error.message
    });
  }
};

module.exports = {
  updateEvaluationSheet
};
