const jwt = require('jsonwebtoken');
const config = require('../config');
const { prisma } = require('../config/database');

/**
 * Authentication Middleware
 * Validates JWT from Authorization Bearer header or HTTP-only cookies.
 * Attaches the authenticated user (without passwordHash) to req.user.
 */
const authenticateToken = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header (format: "Bearer <token>")
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Fallback to HttpOnly cookie
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    // Verify token validity and expiration
    const decoded = jwt.verify(token, config.jwtSecret);

    // Verify user exists and remains active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or deactivated.',
      });
    }

    // Never expose passwordHash on request user object
    const { passwordHash, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    next(error);
  }
};

/**
 * Role-Based Authorization Middleware (RBAC)
 * Enforces backend permissions by validating that the authenticated user possesses one of the allowed roles.
 * @param  {...string} roles Allowed roles ('STUDENT', 'ALUMNI', 'ADMIN')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of the following roles: [${roles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
