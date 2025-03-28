// controllers/participantController.js
const Participant = require('../models/Participant');

// @desc    Get all participants
// @route   GET /api/participants
// @access  Public
const getParticipants = async (req, res) => {
  try {
    const participants = await Participant.find().populate('checkedInBy', 'name');
    res.json(participants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Create a participant
// @route   POST /api/participants
// @access  Public
const createParticipant = async (req, res) => {
  try {
    const { name, type } = req.body;
    
    const participant = new Participant({
      name,
      type: type || 'supporter'
    });
    
    const savedParticipant = await participant.save();
    res.status(201).json(savedParticipant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update participant check-in status
// @route   PUT /api/participants/:id/checkin
// @access  Public
const checkInParticipant = async (req, res) => {
  try {
    const { checkInStatus, checkInTime, checkInPhoto, checkedInBy } = req.body;
    
    const participant = await Participant.findById(req.params.id);
    
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }
    
    participant.checkInStatus = checkInStatus;
    participant.checkInTime = checkInTime;
    participant.checkInPhoto = checkInPhoto;
    participant.checkedInBy = checkedInBy;
    
    const updatedParticipant = await participant.save();
    
    // Populate checkedInBy để trả về tên admin
    const populatedParticipant = await Participant.findById(updatedParticipant._id)
      .populate('checkedInBy', 'name');
      
    res.json(populatedParticipant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getParticipants,
  createParticipant,
  checkInParticipant
};