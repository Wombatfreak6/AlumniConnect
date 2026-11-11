const app = require('./app');
const config = require('./config');
const { connectDB, disconnectDB } = require('./config/database');
const { flushEmailDeliveries } = require('./modules/notifications/notifications.service');

let server;

/**
 * Graceful application shutdown handler
 */
async function handleShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(() => {
      console.log('[Server] HTTP server closed');
    });
  }

  try {
    await flushEmailDeliveries();
    await disconnectDB();
    console.log('[Server] Graceful shutdown completed cleanly');
    process.exit(0);
  } catch (error) {
    console.error('[Server] Error during graceful shutdown:', error.message);
    process.exit(1);
  }
}

/**
 * Starts the HTTP server and verifies database connection
 */
async function startServer(port = config.port) {
  try {
    // 1. Verify database connection
    await connectDB();

    // 2. Start HTTP listener
    server = app.listen(port, () => {
      console.log(`[Server] AlumniConnect running on http://localhost:${port}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = Number(port) + 1;
        console.warn(`[Server] Port ${port} is in use. Retrying on port ${nextPort}...`);
        startServer(nextPort);
      } else {
        console.error('[Server] Startup error:', err.message);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('[Server] Startup failure:', error.message);
    process.exit(1);
  }
}

// Process signals for graceful termination
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Process] Uncaught Exception:', error);
  handleShutdown('uncaughtException');
});

// Run server directly when executed as main module
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, handleShutdown };
