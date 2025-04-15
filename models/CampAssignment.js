// models/CampAssignment.js
const mongoose = require('mongoose');

const campAssignmentSchema = new mongoose.Schema({
  campId: {
    type: String,
    required: true
  },
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true,
    unique: true // Mỗi người chỉ được phân công vào một trại
  },
  position: {
    type: String,
    enum: ['leader', 'supporter'],
    required: true
  },
  order: {
    type: Number,
    default: 0 // Vị trí mặc định
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Cập nhật thời gian sửa đổi trước khi lưu
campAssignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CampAssignment', campAssignmentSchema);