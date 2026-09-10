require('dotenv').config();

const dns = require('dns');

// Fix MongoDB Atlas SRV DNS resolution
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const companyRoutes = require('./src/routes/companyRoutes');
const userRoutes = require('./src/routes/userRoutes');
const memberRoutes = require('./src/routes/memberRoutes');
const membershipRoutes = require('./src/routes/membershipRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const followUpRoutes = require('./src/routes/followUpRoutes');
const kioskRoutes = require('./src/routes/kioskRoutes');
const photoSessionRoutes = require('./src/routes/photoSessionRoutes');
const platformSettingsRoutes = require('./src/routes/platformSettingsRoutes');

const app = express();

// --------------------------------------------------
// Core Middleware
// --------------------------------------------------

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(mongoSanitize());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// --------------------------------------------------
// Rate Limiting
// --------------------------------------------------

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts, please try again later.',
  },
});

app.use('/api/auth', authLimiter);

// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
  });
});

// --------------------------------------------------
// API Routes
// --------------------------------------------------

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/membership-plans', membershipRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/kiosk', kioskRoutes);
app.use('/api/photo-sessions', photoSessionRoutes);
app.use('/api/platform-settings', platformSettingsRoutes);

// --------------------------------------------------
// 404 + Error Handler
// These MUST be registered last
// --------------------------------------------------

app.use(notFound);
app.use(errorHandler);

// --------------------------------------------------
// Start Server
// --------------------------------------------------

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });

module.exports = app;