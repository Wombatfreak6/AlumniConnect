const { Router } = require('express');
const usersController = require('./users.controller');
const { authenticateToken } = require('../../middleware/authMiddleware');

const router = Router();

router.get('/me', authenticateToken, usersController.getMe);
router.put('/me', authenticateToken, usersController.updateMe);

router.post('/me/skills', authenticateToken, usersController.addSkill);
router.delete('/me/skills/:skillId', authenticateToken, usersController.removeSkill);

// Keep this last so /me routes are matched first.
router.get('/:id', usersController.getUserById);

module.exports = router;
