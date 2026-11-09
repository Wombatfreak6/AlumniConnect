const referralsService = require('./referrals.service');
const {
  validateReferralRequest,
  validateIntegerId,
  validateStatusFilter,
} = require('./referrals.validation');

/**
 * POST /api/jobs/:id/referrals
 * Student requests a referral for the specified job.
 * Authorization: STUDENT only.
 */
async function requestReferral(req, res, next) {
  try {
    const { isValid: idValid, error: idError, id: jobPostId } = validateIntegerId(
      req.params.id,
      'jobId'
    );
    if (!idValid) {
      return res.status(400).json({ success: false, message: idError });
    }

    const { isValid, errors, sanitized } = validateReferralRequest(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    const studentId = req.user.userId || req.user.id;
    const referral = await referralsService.createReferral({
      studentId,
      jobPostId,
      message: sanitized.message,
    });

    return res.status(201).json({
      success: true,
      message: 'Referral request submitted successfully.',
      data: { referral },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/alumni/referrals
 * Returns referral requests received by the authenticated alumnus.
 * Authorization: ALUMNI only.
 */
async function getAlumniReferrals(req, res, next) {
  try {
    const { isValid, error, status } = validateStatusFilter(req.query.status);
    if (!isValid) {
      return res.status(400).json({ success: false, message: error });
    }

    const alumniId = req.user.userId || req.user.id;
    const referrals = await referralsService.getAlumniReferrals(alumniId, status);

    return res.status(200).json({
      success: true,
      message: 'Alumni referrals retrieved successfully.',
      data: { referrals },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/student/referrals
 * Returns referral requests submitted by the authenticated student.
 * Authorization: STUDENT only.
 */
async function getStudentReferrals(req, res, next) {
  try {
    const studentId = req.user.userId || req.user.id;
    const referrals = await referralsService.getStudentReferrals(studentId);

    return res.status(200).json({
      success: true,
      message: 'Student referrals retrieved successfully.',
      data: { referrals },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/referrals/:id/status
 * Updates the status of a referral request.
 * Authorization: ALUMNI only (and must be assigned alumniId).
 */
async function updateStatus(req, res, next) {
  try {
    const { isValid: idValid, error: idError, id: referralId } = validateIntegerId(
      req.params.id,
      'referralId'
    );
    if (!idValid) {
      return res.status(400).json({ success: false, message: idError });
    }

    if (!req.body.status) {
      return res.status(400).json({
        success: false,
        message: 'status is required.',
      });
    }

    const currentUserId = req.user.userId || req.user.id;
    const updatedReferral = await referralsService.updateReferralStatus(
      referralId,
      req.body.status,
      currentUserId
    );

    return res.status(200).json({
      success: true,
      message: 'Referral status updated successfully.',
      data: { referral: updatedReferral },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requestReferral,
  getAlumniReferrals,
  getStudentReferrals,
  updateStatus,
};

