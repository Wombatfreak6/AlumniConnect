const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const authRoutes = require('./modules/auth/auth.routes');

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

// ============================================================================
// ERROR & 404 HANDLERS
// ============================================================================

// 404 Not Found handler
app.use(notFoundMiddleware);

// Centralized Error handler
app.use(errorMiddleware);

module.exports = app;
