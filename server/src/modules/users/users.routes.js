const { Router } = require('express');
const usersController = require('./users.controller');
const { authenticateToken } = require('../../middleware/authMiddleware');

const router = Router();

// ============================================================================
// AUTHENTICATED CURRENT USER PROFILE ENDPOINTS
// ============================================================================
router.get('/me', authenticateToken, usersController.getMe);
router.put('/me', authenticateToken, usersController.updateMe);

// ============================================================================
// AUTHENTICATED USER SKILLS MANAGEMENT ENDPOINTS
// ============================================================================
router.post('/me/skills', authenticateToken, usersController.addSkill);
router.delete('/me/skills/:skillId', authenticateToken, usersController.removeSkill);

// ============================================================================
// PUBLIC USER DISCOVERY ENDPOINT
// ============================================================================
router.get('/:id', usersController.getUserById);

module.exports = router;
