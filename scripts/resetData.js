// scripts/resetData.js
const path = require('path');

// Tìm file .env ở thư mục gốc của dự án
const dotenvPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: dotenvPath });

// Kiểm tra xem các biến môi trường đã được tải đúng chưa
console.log('Kiểm tra biến môi trường:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Đã tải ✓' : 'Thiếu ✗');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Đã tải ✓' : 'Thiếu ✗');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Đã tải ✓' : 'Thiếu ✗');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Đã tải ✓' : 'Thiếu ✗');

const mongoose = require('mongoose');
const { cloudinary } = require('../config/cloudinary');
const { sampleUsers, sampleParticipants } = require('./sampleData');

// Kết nối đến MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Tạo mô hình User và Participant
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'admin'
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['leader', 'supporter'],
    required: true
  },
  checkInStatus: {
    type: Boolean,
    default: false
  },
  checkInTime: {
    type: Date,
    default: null
  },
  checkInPhoto: {
    type: String,
    default: null
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

const Participant = mongoose.model('Participant', participantSchema);

// Dữ liệu mẫu được import từ file sampleData.js

// Xóa ảnh từ Cloudinary
const deleteCloudinaryImages = async () => {
  try {
    console.log('Đang xóa ảnh từ Cloudinary...');

    // Lấy danh sách tất cả ảnh trong thư mục checkin-app
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'checkin-app/',
      max_results: 500
    });

    if (result.resources.length === 0) {
      console.log('Không có ảnh nào để xóa từ Cloudinary');
      return;
    }

    console.log(`Tìm thấy ${result.resources.length} ảnh để xóa`);

    // Xóa từng ảnh
    for (const resource of result.resources) {
      const publicId = resource.public_id;
      console.log(`Đang xóa ảnh: ${publicId}`);
      await cloudinary.uploader.destroy(publicId);
    }

    console.log('Đã xóa tất cả ảnh từ Cloudinary');
  } catch (error) {
    console.error('Lỗi khi xóa ảnh từ Cloudinary:', error);
  }
};

// Xóa và tạo lại dữ liệu
const resetData = async () => {
  try {
    // Kết nối đến database
    await connectDB();

    // Xóa ảnh từ Cloudinary
    await deleteCloudinaryImages();

    // Xóa tất cả dữ liệu hiện có
    console.log('Đang xóa dữ liệu hiện có...');
    await User.deleteMany({});
    await Participant.deleteMany({});
    console.log('Đã xóa tất cả dữ liệu User và Participant');

    // Tạo lại dữ liệu User
    console.log('Đang tạo lại dữ liệu User...');
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`Đã tạo ${createdUsers.length} User`);

    // Tạo lại dữ liệu Participant
    console.log('Đang tạo lại dữ liệu Participant...');
    const createdParticipants = await Participant.insertMany(sampleParticipants);
    console.log(`Đã tạo ${createdParticipants.length} Participant`);

    // Hiển thị thông tin tóm tắt
    console.log('\n=== THÔNG TIN TÓM TẮT ===');
    console.log(`Số lượng User: ${createdUsers.length}`);
    console.log(`Số lượng Participant: ${createdParticipants.length}`);
    console.log('- Leaders:', createdParticipants.filter(p => p.type === 'leader').length);
    console.log('- Supporters:', createdParticipants.filter(p => p.type === 'supporter').length);

    // Đóng kết nối
    await mongoose.connection.close();
    console.log('Đã đóng kết nối đến MongoDB');

    console.log('\nQUÁ TRÌNH RESET DỮ LIỆU HOÀN TẤT!');
  } catch (error) {
    console.error('Lỗi khi reset dữ liệu:', error);
    // Đảm bảo đóng kết nối trong trường hợp lỗi
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

// Thêm xác nhận trước khi xóa dữ liệu
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n⚠️ CẢNH BÁO: Bạn sắp xóa TẤT CẢ dữ liệu User và Participant! ⚠️');
console.log('Hành động này không thể hoàn tác và sẽ xóa tất cả ảnh trên Cloudinary.');

readline.question('\nNhập "XÓA HẾT" để xác nhận: ', (answer) => {
  if (answer === 'XÓA HẾT') {
    console.log('\nĐang bắt đầu quá trình reset dữ liệu...');
    resetData().then(() => {
      readline.close();
      process.exit(0);
    });
  } else {
    console.log('Hủy bỏ thao tác. Không có dữ liệu nào bị xóa.');
    readline.close();
    process.exit(0);
  }
});
