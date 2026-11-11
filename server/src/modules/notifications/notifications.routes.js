const { Router } = require('express');
const { authenticateToken } = require('../../middleware/authMiddleware');
const controller = require('./notifications.controller');

const router = Router();
router.use(authenticateToken);
router.get('/stream', controller.stream);
router.get('/', controller.list);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);

module.exports = router;
