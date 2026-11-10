const { Router } = require('express');
const adminController = require('./admin.controller');
const { authenticateToken, authorizeRoles } = require('../../middleware/authMiddleware');

const router = Router();

// Enforce authentication and ADMIN role for all routes in this router
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/users', adminController.getUsers);
router.get('/stats', adminController.getStats);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/status', adminController.updateStatus);

module.exports = router;
