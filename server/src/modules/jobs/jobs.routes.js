const { Router } = require('express');
const jobsController = require('./jobs.controller');
const referralsController = require('../referrals/referrals.controller');
const { authenticateToken, authorizeRoles } = require('../../middleware/authMiddleware');

const router = Router();

// ============================================================================
// IMPORTANT: Static routes must be registered BEFORE parameterised routes.
// 'GET /my' must come before 'GET /:id' so Express does not treat the string
// "my" as a jobId integer and pass it to validateIntegerId.
// ============================================================================

// Alumni: list their own job postings with referral summaries
router.get(
  '/my',
  authenticateToken,
  authorizeRoles('ALUMNI'),
  jobsController.getMyJobs
);

// All authenticated users: browse paginated, filtered job board
router.get(
  '/',
  authenticateToken,
  jobsController.listJobs
);

// Alumni: create a new job post
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ALUMNI'),
  jobsController.createJob
);

// All authenticated users: view full details of a single job
router.get(
  '/:id',
  authenticateToken,
  jobsController.getJobById
);

// Student: request a referral for a specific job post
router.post(
  '/:id/referrals',
  authenticateToken,
  authorizeRoles('STUDENT'),
  referralsController.requestReferral
);

// Original alumni poster or ADMIN: update a job post
router.put(
  '/:id',
  authenticateToken,
  jobsController.updateJob
);

// Original alumni poster or ADMIN: delete a job post
router.delete(
  '/:id',
  authenticateToken,
  jobsController.deleteJob
);

module.exports = router;

