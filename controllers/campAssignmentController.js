// controllers/campAssignmentController.js
const CampAssignment = require('../models/CampAssignment');

// Lấy tất cả phân công trại
const getCampAssignments = async (req, res) => {
  try {
    const assignments = await CampAssignment.find()
      .populate('participantId', 'name type checkInStatus checkInPhoto');
    
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching camp assignments:', error);
    res.status(500).json({ message: error.message });
  }
};

// Tạo hoặc cập nhật phân công
const updateCampAssignment = async (req, res) => {
  try {
    const { participantId, campId, position } = req.body;
    
    // Validate request
    if (!participantId || !campId || !position) {
      return res.status(400).json({ message: 'Thiếu thông tin phân công' });
    }
    
    // Tìm phân công hiện tại
    let assignment = await CampAssignment.findOne({ participantId });
    
    if (assignment) {
      // Cập nhật nếu đã tồn tại
      assignment.campId = campId;
      assignment.position = position;
    } else {
      // Tạo mới nếu chưa có
      assignment = new CampAssignment({
        campId,
        participantId,
        position
      });
    }
    
    const savedAssignment = await assignment.save();
    const populatedAssignment = await CampAssignment.findById(savedAssignment._id)
      .populate('participantId', 'name type checkInStatus checkInPhoto');
    
    res.json(populatedAssignment);
  } catch (error) {
    console.error('Error updating camp assignment:', error);
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ message: 'Người tham gia đã được phân công vào trại khác' });
    }
    res.status(400).json({ message: error.message });
  }
};

// Xóa phân công
const deleteCampAssignment = async (req, res) => {
  try {
    const participantId = req.params.id;
    
    const result = await CampAssignment.findOneAndDelete({ participantId });
    
    if (!result) {
      return res.status(404).json({ message: 'Không tìm thấy phân công' });
    }
    
    res.json({ message: 'Đã xóa phân công thành công' });
  } catch (error) {
    console.error('Error deleting camp assignment:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCampAssignments,
  updateCampAssignment,
  deleteCampAssignment
};