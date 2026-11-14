const { Router } = require('express');
const controller = require('./mentorship.controller');
const { authenticateToken, authorizeRoles } = require('../../middleware/authMiddleware');

const router = Router();
router.use(authenticateToken);

router.get('/slots/my', authorizeRoles('ALUMNI'), controller.mySlots);
router.get('/slots', controller.slots);
router.get('/slots/:id', controller.getSlot);
router.post('/slots', authorizeRoles('ALUMNI'), controller.createSlot);
router.put('/slots/:id', authorizeRoles('ALUMNI', 'ADMIN'), controller.updateSlot);
router.delete('/slots/:id', authorizeRoles('ALUMNI', 'ADMIN'), controller.deleteSlot);

router.post('/requests', authorizeRoles('STUDENT'), controller.createRequest);
router.get(
  '/requests/sent',
  authorizeRoles('STUDENT'),
  (req, res, next) => {
    req.params.direction = 'sent';
    controller.requests(req, res, next);
  }
);
router.get(
  '/requests/received',
  authorizeRoles('ALUMNI', 'ADMIN'),
  (req, res, next) => {
    req.params.direction = 'received';
    controller.requests(req, res, next);
  }
);
router.patch(
  '/requests/:id/status',
  authorizeRoles('STUDENT', 'ALUMNI', 'ADMIN'),
  controller.updateRequest
);

module.exports = router;
