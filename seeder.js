// Tạo file seeder.js để nhập dữ liệu mẫu
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Participant = require('./models/Participant');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Sample data
const users = [
  { name: 'Admin 1', role: 'admin' },
  { name: 'Admin 3', role: 'admin' }
];

const participants = [
  { name: 'Người tham gia 1' },
  { name: 'Người tham gia 2' },
  { name: 'Người tham gia 3' }
];

// Import data
const importData = async () => {
  try {
    await User.deleteMany();
    await Participant.deleteMany();
    
    await User.insertMany(users);
    await Participant.insertMany(participants);
    
    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Delete data
const destroyData = async () => {
  try {
    await User.deleteMany();
    await Participant.deleteMany();
    
    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}