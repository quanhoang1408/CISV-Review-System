// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  authUser,
  deleteParticipantPhoto
} = require('../controllers/userController');

// Các route cơ bản
router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// Route xác thực
router.post('/auth', authUser);

// Route xóa ảnh người tham gia
router.delete('/delete-photo/:id', deleteParticipantPhoto);

module.exports = router;