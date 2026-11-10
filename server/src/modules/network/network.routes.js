const { Router } = require('express');
const networkController = require('./network.controller');
const { authenticateToken, authorizeRoles } = require('../../middleware/authMiddleware');

const router = Router();

// ============================================================================
// NETWORK & MATCHING RECOMMENDATION ROUTES (/api/network)
// ============================================================================

// STUDENT: Get matching alumni network recommendations
router.get(
  '/matches',
  authenticateToken,
  authorizeRoles('STUDENT'),
  networkController.getAlumniMatches
);

// STUDENT: Get job recommendations (direct alias: /api/network/jobs/recommendations)
router.get(
  '/jobs/recommendations',
  authenticateToken,
  authorizeRoles('STUDENT'),
  networkController.getJobRecommendations
);

module.exports = router;

