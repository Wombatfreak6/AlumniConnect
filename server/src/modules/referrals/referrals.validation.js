/**
 * Input validation for Job Referrals module
 */

const VALID_REFERRAL_STATUSES = ['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'];

const ALLOWED_STATUS_TRANSITIONS = {
  PENDING: ['REVIEWED', 'ACCEPTED', 'REJECTED'],
  REVIEWED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: [], // terminal state
  REJECTED: [], // terminal state
};

/**
 * Validates the referral request payload submitted by a student.
 */
function validateReferralRequest(body) {
  const errors = [];
  let sanitizedMessage = null;

  if (body.message !== undefined && body.message !== null) {
    if (typeof body.message !== 'string') {
      errors.push('message must be a string.');
    } else if (body.message.trim().length > 1500) {
      errors.push('message cannot exceed 1500 characters.');
    } else if (body.message.trim().length > 0) {
      sanitizedMessage = body.message.trim();
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      message: sanitizedMessage,
    },
  };
}

/**
 * Validates a status update transition for a referral.
 * Enforces business logic:
 *   PENDING -> REVIEWED, ACCEPTED, REJECTED
 *   REVIEWED -> ACCEPTED, REJECTED
 *   ACCEPTED / REJECTED -> terminal, no transitions allowed
 */
function validateStatusTransition(currentStatus, targetStatus) {
  if (!targetStatus) {
    return {
      isValid: false,
      error: 'status is required.',
    };
  }

  if (!VALID_REFERRAL_STATUSES.includes(targetStatus)) {
    return {
      isValid: false,
      error: `Invalid status. Must be one of: ${VALID_REFERRAL_STATUSES.join(', ')}.`,
    };
  }

  if (currentStatus === targetStatus) {
    return {
      isValid: false,
      error: `Referral is already in status '${currentStatus}'.`,
    };
  }

  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    if (allowed.length === 0) {
      return {
        isValid: false,
        error: `Cannot update referral status from '${currentStatus}'. This is a final/terminal status.`,
      };
    }
    return {
      isValid: false,
      error: `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed: [${allowed.join(', ')}].`,
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Validates a route parameter ID (integer > 0).
 */
function validateIntegerId(paramValue, paramName = 'id') {
  const id = Number(paramValue);
  if (!Number.isInteger(id) || id <= 0) {
    return {
      isValid: false,
      error: `Invalid ${paramName}: must be a positive integer.`,
      id: null,
    };
  }
  return { isValid: true, error: null, id };
}

/**
 * Validates optional status filter in query params.
 */
function validateStatusFilter(status) {
  if (!status) return { isValid: true, status: null };
  const upper = status.trim().toUpperCase();
  if (!VALID_REFERRAL_STATUSES.includes(upper)) {
    return {
      isValid: false,
      error: `Invalid status filter. Must be one of: ${VALID_REFERRAL_STATUSES.join(', ')}.`,
      status: null,
    };
  }
  return { isValid: true, error: null, status: upper };
}

module.exports = {
  validateReferralRequest,
  validateStatusTransition,
  validateIntegerId,
  validateStatusFilter,
  VALID_REFERRAL_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
};

