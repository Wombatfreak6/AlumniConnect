/**
 * Centralized Error Handling Middleware
 * Catches all unhandled synchronous and asynchronous errors forwarded via next(err).
 * Ensures a consistent error response structure and logs error details.
 */
const errorMiddleware = (err, req, res, next) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorMiddleware;
