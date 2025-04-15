// simpleReset.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Participant = require('./models/Participant');

dotenv.config();

// Kết nối đến MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Đã kết nối đến MongoDB'))
  .catch(err => {
    console.error('Lỗi kết nối MongoDB:', err);
    process.exit(1);
  });

/**
 * Hàm đặt lại trạng thái check-in cho một participant
 * @param {Object} participant - Đối tượng participant
 */
const resetSingleParticipant = async (participant) => {
  try {
    if (participant.checkInStatus) {
      console.log(`\nĐang đặt lại trạng thái check-in cho: ${participant.name}`);
      
      // Ghi lại URL ảnh vào file log (nếu cần xóa trên Cloudinary sau này)
      if (participant.checkInPhoto) {
        const logEntry = `${new Date().toISOString()} - ${participant.name} - ${participant.checkInPhoto}\n`;
        fs.appendFileSync('reset-photos.log', logEntry);
        console.log(`Đã ghi URL ảnh vào file log: reset-photos.log`);
      }
      
      // Đặt lại các trường check-in
      participant.checkInStatus = false;
      participant.checkInTime = null;
      participant.checkInPhoto = null;
      participant.checkedInBy = null;
      
      await participant.save();
      console.log(`Đã đặt lại trạng thái check-in cho: ${participant.name}`);
      return true;
    } else {
      console.log(`\n${participant.name} chưa check-in, không cần đặt lại.`);
      return false;
    }
  } catch (error) {
    console.error(`Lỗi khi đặt lại cho ${participant.name}:`, error);
    return false;
  }
};

/**
 * Hàm đặt lại trạng thái check-in cho nhiều participants
 * @param {Array} participantNames - Danh sách tên participants
 */
const resetMultipleParticipants = async (participantNames) => {
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  console.log(`Bắt đầu xử lý ${participantNames.length} participants...`);
  
  for (const name of participantNames) {
    try {
      // Tìm participants theo tên chính xác
      const participant = await Participant.findOne({
        name: { $regex: `^${name}$`, $options: 'i' }
      });
      
      if (!participant) {
        console.log(`\nKhông tìm thấy participant: ${name}`);
        errorCount++;
        continue;
      }
      
      const result = await resetSingleParticipant(participant);
      if (result) {
        successCount++;
      } else {
        skipCount++;
      }
    } catch (error) {
      console.error(`\nLỗi xử lý ${name}:`, error);
      errorCount++;
    }
  }
  
  console.log('\n--- KẾT QUẢ ---');
  console.log(`Tổng số xử lý: ${participantNames.length}`);
  console.log(`Đã đặt lại thành công: ${successCount}`);
  console.log(`Đã bỏ qua (chưa check-in): ${skipCount}`);
  console.log(`Lỗi: ${errorCount}`);
};

/**
 * Hàm đặt lại trạng thái check-in cho tất cả participants
 */
const resetAllParticipants = async () => {
  try {
    // Lấy tất cả participants đã check-in
    const participants = await Participant.find({ checkInStatus: true });
    
    if (participants.length === 0) {
      console.log('Không có participant nào đã check-in');
      return;
    }
    
    console.log(`Tìm thấy ${participants.length} participant đã check-in`);
    
    let successCount = 0;
    
    for (const participant of participants) {
      const result = await resetSingleParticipant(participant);
      if (result) successCount++;
    }
    
    console.log('\n--- KẾT QUẢ ---');
    console.log(`Tổng số participants đã check-in: ${participants.length}`);
    console.log(`Đã đặt lại thành công: ${successCount}`);
  } catch (error) {
    console.error('Lỗi:', error);
  }
};

/**
 * Hàm tìm kiếm và đặt lại trạng thái cho một participant theo tên
 * @param {string} nameQuery - Tên cần tìm kiếm
 */
const resetByName = async (nameQuery) => {
  try {
    // Tìm participant theo tên (tìm kiếm tương đối)
    const participant = await Participant.findOne({
      name: { $regex: nameQuery, $options: 'i' }
    });
    
    if (!participant) {
      console.log(`Không tìm thấy participant có tên: ${nameQuery}`);
      return;
    }
    
    await resetSingleParticipant(participant);
  } catch (error) {
    console.error('Lỗi:', error);
  }
};

// Danh sách tên cần đặt lại (có thể thay đổi)
const participantNames = [
  'Nguyễn Trịnh Thái Hưng',
  'Nghiêm An Thái',
  'Phạm Hà Thu',
  'Nguyễn Lan Thy',
  'Nguyễn Minh Thảo',
  'Nguyễn Quốc Tuấn',
  'Trần Hà',
  'Nguyễn Anh Phương',
  'Nguyễn Gia Bảo',
  'Trần Hoàng Long',
  'Lê Đàm Minh Quang Sâu',
  'Nguyễn Hồng Cơ',
  'Trần Đức Khánh',
  'Nguyễn Hà My',
  'Nguyễn Gia Linh',
  'Bùi Khánh Linh',
  'Lê Minh Đạo',
  'Phạm Khoa Hiển',
  'Đỗ Đức Kiên',
  'Doãn Thảo Linh',
  'Lê Bùi Vân Trang',
  'Nguyễn Lan Phương',
  'Vũ Xuân Bách',
  'Lâm Minh Đăng',
  'Nguyễn Tăng Hưng',
  'Nguyễn Tuấn Phước',
  'Nguyễn Diệu Châu',
  'Nguyễn Thuỳ Linh'
];

/**
 * Hàm chính để xử lý các tham số dòng lệnh
 */
const main = async () => {
  try {
    // Lấy tham số từ dòng lệnh
    const mode = process.argv[2];
    
    if (!mode || !['list', 'all', 'single'].includes(mode)) {
      console.log('Sử dụng: node simpleReset.js [mode] [name]');
      console.log('  mode: "list" - đặt lại cho danh sách đã định nghĩa sẵn');
      console.log('  mode: "all" - đặt lại cho tất cả participants đã check-in');
      console.log('  mode: "single" - đặt lại cho một participant theo tên');
      console.log('  name: tên participant (chỉ cần khi mode=single)');
      process.exit(1);
    }

    if (mode === 'list') {
      await resetMultipleParticipants(participantNames);
    } else if (mode === 'all') {
      await resetAllParticipants();
    } else if (mode === 'single') {
      const nameArg = process.argv[3];
      if (!nameArg) {
        console.log('Thiếu tên participant. Sử dụng: node simpleReset.js single "Tên người dùng"');
        process.exit(1);
      }
      
      await resetByName(nameArg);
    }
    
    // Ngắt kết nối và thoát
    console.log('\nHoàn tất xử lý!');
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Lỗi:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Chạy chương trình
main();