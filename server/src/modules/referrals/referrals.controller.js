const referralsService = require('./referrals.service');
const {
  validateReferralRequest,
  validateIntegerId,
  validateStatusFilter,
} = require('./referrals.validation');

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

    const studentId = req.user.id;
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

async function getAlumniReferrals(req, res, next) {
  try {
    const { isValid, error, status } = validateStatusFilter(req.query.status);
    if (!isValid) {
      return res.status(400).json({ success: false, message: error });
    }

    const alumniId = req.user.id;
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

async function getStudentReferrals(req, res, next) {
  try {
    const studentId = req.user.id;
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

    const currentUserId = req.user.id;
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

