// models/Participant.js
const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['leader', 'supporter'],
    default: 'supporter'
  },
  dateOfBirth: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  facebookLink: {
    type: String,
    default: ''
  },
  checkInStatus: {
    type: Boolean,
    default: false
  },
  checkInTime: {
    type: Date
  },
  checkInPhoto: {
    type: String
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('Participant', participantSchema);
