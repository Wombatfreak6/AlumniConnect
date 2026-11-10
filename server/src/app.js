const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const skillsRoutes = require('./modules/skills/skills.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const jobsRoutes = require('./modules/jobs/jobs.routes');
const referralsRoutes = require('./modules/referrals/referrals.routes');
const referralsController = require('./modules/referrals/referrals.controller');
const networkRoutes = require('./modules/network/network.routes');
const mentorshipRoutes = require('./modules/mentorship/mentorship.routes');
const eventsRoutes = require('./modules/events/events.routes');
const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');

const app = express();

// ============================================================================
// GLOBAL MIDDLEWARES
// ============================================================================

// CORS configuration for the React frontend
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware
app.use(cookieParser());

// Development request logger
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// ============================================================================
// ROUTES
// ============================================================================

// Root API information endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to AlumniConnect API',
  });
});

// Health check endpoint
// Expected response: { "success": true, "message": "AlumniConnect API is running" }
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AlumniConnect API is running',
  });
});

// Authentication module routes
app.use('/api/auth', authRoutes);

// User and Profile management routes
app.use('/api/users', usersRoutes);

// Skills catalog routes
app.use('/api/skills', skillsRoutes);

// Administrative oversight routes (RBAC protected)
app.use('/api/admin', adminRoutes);

// Job board and posting management routes
app.use('/api/jobs', jobsRoutes);

// Referral workflow routes
app.use('/api/referrals', referralsRoutes);

// Intelligent network matching & recommendations
app.use('/api/network', networkRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/events', eventsRoutes);

// Direct alumni and student referral endpoints (as specified in Handover spec)
app.get(
  '/api/alumni/referrals',
  authenticateToken,
  authorizeRoles('ALUMNI'),
  referralsController.getAlumniReferrals
);
app.get(
  '/api/student/referrals',
  authenticateToken,
  authorizeRoles('STUDENT'),
  referralsController.getStudentReferrals
);

// ============================================================================
// ERROR & 404 HANDLERS
// ============================================================================

// 404 Not Found handler
app.use(notFoundMiddleware);

// Centralized Error handler
app.use(errorMiddleware);

module.exports = app;
