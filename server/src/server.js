const express = require('express');
const cors = require('cors');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Global Middlewares
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AlumniConnect API',
    version: '1.0.0',
    description: 'Intelligent Platform to Interconnect Alumni and Students',
    status: 'online',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'alumni-connect-server',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.url}`,
    },
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server when executed directly
if (require.main === module) {
  const PORT = config.port;
  const server = app.listen(PORT, () => {
    console.log(`[AlumniConnect Server] Running on http://localhost:${PORT} in ${config.nodeEnv} mode`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const fallbackPort = Number(PORT) + 1;
      console.warn(`[AlumniConnect Server] Port ${PORT} is in use (often AirPlay Receiver on macOS). Starting on http://localhost:${fallbackPort}...`);
      app.listen(fallbackPort, () => {
        console.log(`[AlumniConnect Server] Running on http://localhost:${fallbackPort} in ${config.nodeEnv} mode`);
      });
    } else {
      console.error('[AlumniConnect Server] Server startup error:', err);
      process.exit(1);
    }
  });
}

module.exports = app;
