const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Agar aapke paas scheduler ki file hai toh use import karein
let initScheduler;
try {
  initScheduler = require('./utils/scheduler').initScheduler;
} catch (error) {
  // Ignore if scheduler doesn't exist yet
}

// 1. Route Imports
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const udhariRoutes = require('./routes/udhariRoutes');
const goalRoutes = require('./routes/goalRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Newly Added Modules
const aiRoutes = require('./routes/aiRoutes');   // TrackOne AI Module
const emiRoutes = require('./routes/emiRoutes'); // EMI Tracker Module

// Load Env
dotenv.config();

// Connect Database
connectDB();

// 2. INITIALIZE APP (Ye line routes se pehle aani zaroori hai!)
const app = express();

// 3. Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for profile photos/receipts uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. Mount Routes (Ab hum yahan safely app.use kar sakte hain)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/income', incomeRoutes);
app.use('/api/v1/udhari', udhariRoutes);
app.use('/api/v1/goals', goalRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Mount New Features
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/emi', emiRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('TrackOne-Money API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Define Port and Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  
  // Initialize Cron Jobs if they exist
  if (typeof initScheduler === 'function') {
    initScheduler();
  }
});