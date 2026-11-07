/**
 * 404 Not Found Middleware
 * Intercepts requests that do not match any registered route and returns a consistent JSON response.
 */
const notFoundMiddleware = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = notFoundMiddleware;
