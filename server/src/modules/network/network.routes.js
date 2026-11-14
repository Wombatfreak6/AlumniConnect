const { Router } = require('express');
const networkController = require('./network.controller');
const { authenticateToken, authorizeRoles } = require('../../middleware/authMiddleware');

const router = Router();

router.get(
  '/matches',
  authenticateToken,
  authorizeRoles('STUDENT'),
  networkController.getAlumniMatches
);

router.get(
  '/jobs/recommendations',
  authenticateToken,
  authorizeRoles('STUDENT'),
  networkController.getJobRecommendations
);

module.exports = router;

