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
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');

const app = express();

app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to AlumniConnect API',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AlumniConnect API is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Referral shortcuts kept for the handover API spec.
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

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
