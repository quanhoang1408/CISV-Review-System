// controllers/participantController.js
const Participant = require('../models/Participant');
const { cloudinary } = require('../config/cloudinary');
const { updateParticipantCheckInStatus, resetParticipantCheckInStatus } = require('../services/googleSheetsService');

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

    // Update Google Sheets if enabled in environment variables
    if (process.env.GOOGLE_SHEETS_ENABLED === 'true') {
      try {
        console.log(`Updating Google Sheets for ${participant.name}`);
        const sheetsResult = await updateParticipantCheckInStatus(participant.name, checkInStatus);
        console.log('Google Sheets update result:', sheetsResult);
      } catch (sheetsError) {
        console.error('Error updating Google Sheets:', sheetsError);
        // Continue even if Google Sheets update fails
      }
    }

    res.json(populatedParticipant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reset participant check-in status and delete photo
// @route   PUT /api/participants/:id/reset-checkin
// @access  Public
const resetCheckIn = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // If there's a photo URL, extract the public ID and delete from Cloudinary
    if (participant.checkInPhoto) {
      try {
        // Extract public ID from the URL
        // URL format: https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/checkin-app/abcdef123456.jpg
        const urlParts = participant.checkInPhoto.split('/');
        const filenameWithExtension = urlParts[urlParts.length - 1]; // Get the filename with extension
        const publicIdWithFolder = urlParts[urlParts.length - 2] + '/' + filenameWithExtension.split('.')[0]; // Get folder/filename without extension

        console.log(`Attempting to delete image with public ID: ${publicIdWithFolder}`);

        // Delete the image from Cloudinary
        await cloudinary.uploader.destroy(publicIdWithFolder);
        console.log('Image deleted from Cloudinary');
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
        // Continue with check-in reset even if image deletion fails
      }
    }

    // Reset check-in fields
    participant.checkInStatus = false;
    participant.checkInTime = null;
    participant.checkInPhoto = null;
    participant.checkedInBy = null;

    const updatedParticipant = await participant.save();

    // Update Google Sheets if enabled in environment variables
    if (process.env.GOOGLE_SHEETS_ENABLED === 'true') {
      try {
        console.log(`Resetting Google Sheets check-in status for ${participant.name}`);
        const sheetsResult = await resetParticipantCheckInStatus(participant.name);
        console.log('Google Sheets reset result:', sheetsResult);
      } catch (sheetsError) {
        console.error('Error resetting Google Sheets:', sheetsError);
        // Continue even if Google Sheets update fails
      }
    }

    res.json({
      success: true,
      message: 'Check-in reset successfully',
      participant: updatedParticipant
    });
  } catch (error) {
    console.error('Reset check-in error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Find participant by name
// @route   GET /api/participants/find-by-name
// @access  Public
const findParticipantByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: 'Name parameter is required' });
    }

    // Find participants whose name contains the search string (case insensitive)
    const participants = await Participant.find({
      name: { $regex: name, $options: 'i' }
    }).populate('checkedInBy', 'name');

    if (participants.length === 0) {
      return res.status(404).json({ message: 'No participants found with that name' });
    }

    res.json(participants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a participant
// @route   DELETE /api/participants/:id
// @access  Public
const deleteParticipant = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // If there's a photo URL, extract the public ID and delete from Cloudinary
    if (participant.checkInPhoto) {
      try {
        // Extract public ID from the URL
        const urlParts = participant.checkInPhoto.split('/');
        const filenameWithExtension = urlParts[urlParts.length - 1];
        const publicIdWithFolder = urlParts[urlParts.length - 2] + '/' + filenameWithExtension.split('.')[0];

        // Delete the image from Cloudinary
        await cloudinary.uploader.destroy(publicIdWithFolder);
        console.log(`Deleted image from Cloudinary: ${publicIdWithFolder}`);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
        // Continue with participant deletion even if image deletion fails
      }
    }

    // Delete the participant
    await Participant.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Participant deleted successfully'
    });
  } catch (error) {
    console.error('Delete participant error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a participant
// @route   PUT /api/participants/:id
// @access  Public
const updateParticipant = async (req, res) => {
  try {
    const { name, type } = req.body;

    const participant = await Participant.findById(req.params.id);

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Update fields
    if (name) participant.name = name;
    if (type) participant.type = type;

    const updatedParticipant = await participant.save();

    res.json(updatedParticipant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getParticipants,
  createParticipant,
  checkInParticipant,
  resetCheckIn,
  findParticipantByName,
  deleteParticipant,
  updateParticipant
};