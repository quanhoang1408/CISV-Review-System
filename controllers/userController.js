// controllers/userController.js
const User = require('../models/User');
const Participant = require('../models/Participant');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all users (admins)
// @route   GET /api/users
// @access  Public
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a user
// @route   POST /api/users
// @access  Public
const createUser = async (req, res) => {
  try {
    const { name, role, password, isSuperAdmin } = req.body;

    const user = new User({
      name,
      role: role || 'admin',
      password: password || null,
      isSuperAdmin: isSuperAdmin || false
    });

    const savedUser = await user.save();
    // Không trả về password trong response
    const userResponse = {
      _id: savedUser._id,
      name: savedUser.name,
      role: savedUser.role,
      isSuperAdmin: savedUser.isSuperAdmin,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    };

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Public
const updateUser = async (req, res) => {
  try {
    const { name, role, password, isSuperAdmin } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (password !== undefined) user.password = password;
    if (isSuperAdmin !== undefined) user.isSuperAdmin = isSuperAdmin;

    const updatedUser = await user.save();
    // Không trả về password trong response
    const userResponse = {
      _id: updatedUser._id,
      name: updatedUser.name,
      role: updatedUser.role,
      isSuperAdmin: updatedUser.isSuperAdmin,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    res.json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Public
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.remove();
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/users/auth
// @access  Public
const authUser = async (req, res) => {
  try {
    const { name, password } = req.body;
    console.log('Auth request received:', { name, password });

    const user = await User.findOne({ name });
    if (!user) {
      console.log('User not found:', name);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', {
      id: user._id,
      name: user.name,
      isSuperAdmin: user.isSuperAdmin,
      password: user.password
    });

    // Nếu user không có password hoặc không phải superadmin, cho phép đăng nhập không cần password
    if (!user.password || !user.isSuperAdmin) {
      console.log('User does not need password verification');
      // Không trả về password trong response
      const userResponse = {
        _id: user._id,
        name: user.name,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin
      };
      return res.json(userResponse);
    }

    // Kiểm tra password nếu user là superadmin
    console.log('Comparing passwords:', {
      provided: password,
      stored: user.password,
      match: user.password === password
    });

    if (user.password !== password) {
      console.log('Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Authentication successful');
    // Không trả về password trong response
    const userResponse = {
      _id: user._id,
      name: user.name,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete participant photo
// @route   DELETE /api/users/delete-photo/:id
// @access  Public
const deleteParticipantPhoto = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Nếu có ảnh, xóa ảnh từ Cloudinary
    if (participant.checkInPhoto) {
      // Lấy public_id từ URL
      const publicId = participant.checkInPhoto.split('/').pop().split('.')[0];
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(`checkin-app/${publicId}`);
          console.log(`Deleted image from Cloudinary: checkin-app/${publicId}`);
        } catch (cloudinaryError) {
          console.error('Error deleting image from Cloudinary:', cloudinaryError);
        }
      }
    }

    // Cập nhật participant
    participant.checkInPhoto = null;
    const updatedParticipant = await participant.save();

    res.json(updatedParticipant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  authUser,
  deleteParticipantPhoto
};