const { Router } = require('express');
const jobsController = require('./jobs.controller');
const referralsController = require('../referrals/referrals.controller');
const networkController = require('../network/network.controller');
const { authenticateToken, authorizeRoles } = require('../../middleware/authMiddleware');

const router = Router();

// Static routes must stay above /:id, otherwise "my" is treated as a job id.
router.get(
  '/my',
  authenticateToken,
  authorizeRoles('ALUMNI'),
  jobsController.getMyJobs
);

router.get(
  '/',
  authenticateToken,
  jobsController.listJobs
);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('ALUMNI'),
  jobsController.createJob
);

// Also needs to stay above /:id.
router.get(
  '/recommendations',
  authenticateToken,
  authorizeRoles('STUDENT'),
  networkController.getJobRecommendations
);

router.get(
  '/:id',
  authenticateToken,
  jobsController.getJobById
);

router.post(
  '/:id/referrals',
  authenticateToken,
  authorizeRoles('STUDENT'),
  referralsController.requestReferral
);

router.put(
  '/:id',
  authenticateToken,
  jobsController.updateJob
);

router.delete(
  '/:id',
  authenticateToken,
  jobsController.deleteJob
);

module.exports = router;

