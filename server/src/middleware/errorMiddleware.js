/**
 * Centralized Error Handling Middleware
 * Catches all unhandled synchronous and asynchronous errors forwarded via next(err).
 * Ensures a consistent error response structure and logs error details.
 */
const errorMiddleware = (err, req, res, next) => {
  let statusCode = 500;
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 600) {
    statusCode = err.statusCode;
  } else if (res.statusCode >= 400 && res.statusCode < 600) {
    statusCode = res.statusCode;
  }

  // Handle Prisma specific errors
  let message = err.message || 'Internal Server Error';
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'A record with this unique constraint already exists.';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Requested record not found.';
  }

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorMiddleware;
