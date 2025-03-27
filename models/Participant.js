// models/Participant.js
const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
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