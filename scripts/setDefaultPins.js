// scripts/setDefaultPins.js
// Usage: from project root (CISV-Review-System) run: node scripts/setDefaultPins.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const DEFAULT_PIN = '1111';

async function run() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI not set in environment. Create .env with MONGODB_URI or set env var.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    const filter = {
      $or: [
        { password: null },
        { password: '' },
        { password: { $exists: false } }
      ]
    };

    const users = await User.find(filter).select('name');
    console.log(`Found ${users.length} user(s) without PIN:`);
    users.forEach(u => console.log(` - ${u.name} (${u._id})`));

    if (users.length === 0) {
      console.log('No users to update. Exiting.');
      process.exit(0);
    }

    const result = await User.updateMany(filter, { $set: { password: DEFAULT_PIN } });

    // Mongoose v5/v6 differences on result object
    const modified = result.modifiedCount ?? result.nModified ?? result.modified ?? 0;

    console.log(`Updated ${modified} user(s). Set PIN = '${DEFAULT_PIN}' for affected accounts.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

run();
