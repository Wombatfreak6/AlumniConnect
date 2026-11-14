const { Router } = require('express');
const referralsController = require('./referrals.controller');
const { authenticateToken, authorizeRoles } = require('../../middleware/authMiddleware');

const router = Router();

router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('ALUMNI'),
  referralsController.updateStatus
);

router.get(
  '/alumni',
  authenticateToken,
  authorizeRoles('ALUMNI'),
  referralsController.getAlumniReferrals
);

router.get(
  '/student',
  authenticateToken,
  authorizeRoles('STUDENT'),
  referralsController.getStudentReferrals
);

module.exports = router;

