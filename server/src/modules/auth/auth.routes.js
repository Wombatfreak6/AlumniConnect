const { Router } = require('express');
const authController = require('./auth.controller');
const { authenticateToken, authorizeRoles } = require('../../middleware/authMiddleware');

const router = Router();

// Public endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected endpoints
router.get('/me', authenticateToken, authController.getMe);

// Admin-only protected endpoint (RBAC verification)
router.get('/admin/verify', authenticateToken, authorizeRoles('ADMIN'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin access granted.',
    data: {
      admin: req.user,
    },
  });
});

module.exports = router;
