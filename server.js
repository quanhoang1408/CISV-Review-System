// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

// Load env vars
dotenv.config();

// Check critical environment variables before starting
console.log('Checking environment variables:');
const criticalVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
criticalVars.forEach(varName => {
  console.log(`- ${varName}: ${process.env[varName] ? 'Set ✓' : 'Missing ✗'}`);
});

// Connect to database
connectDB();

// Route files
const userRoutes = require('./routes/userRoutes');
const participantRoutes = require('./routes/participantRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory at:', uploadDir);
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Middleware
app.use(cors({
    origin: [
      'https://cisv-review-system-ui.vercel.app',
      'http://localhost:3000'
    ],
    credentials: true
  }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/evaluations', evaluationRoutes);

// Simplified upload routes - just use one path for all upload-related endpoints
app.use('/api/upload-photo', uploadRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Server error',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});