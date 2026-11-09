const { Router } = require('express');
const referralsController = require('./referrals.controller');
const { authenticateToken, authorizeRoles } = require('../../middleware/authMiddleware');

const router = Router();

// ============================================================================
// REFERRAL MANAGEMENT ROUTES (/api/referrals)
// ============================================================================

// ALUMNI: update referral status (REVIEWED, ACCEPTED, REJECTED)
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('ALUMNI'),
  referralsController.updateStatus
);

// ALUMNI: get incoming referrals (alias: /api/referrals/alumni)
router.get(
  '/alumni',
  authenticateToken,
  authorizeRoles('ALUMNI'),
  referralsController.getAlumniReferrals
);

// STUDENT: get submitted referrals (alias: /api/referrals/student)
router.get(
  '/student',
  authenticateToken,
  authorizeRoles('STUDENT'),
  referralsController.getStudentReferrals
);

module.exports = router;
