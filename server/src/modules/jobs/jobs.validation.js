/**
 * Input validation for Job Management module
 * Mirrors the style of users.validation.js — plain functions, no libraries.
 */

const VALID_EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'REMOTE'];
const VALID_EXPERIENCE_LEVELS = ['ENTRY', 'MID', 'SENIOR', 'LEAD'];
const VALID_REFERRAL_STATUSES = ['REVIEWED', 'ACCEPTED', 'REJECTED'];

const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

/**
 * Validates and sanitizes a job post creation or full-update payload.
 * @param {object} body  req.body
 * @param {boolean} requireAll  true for POST (all required fields must be present),
 *                              false for PUT (only provided fields are validated)
 */
function validateJobPost(body, requireAll = true) {
  const errors = [];
  const sanitized = {};

  // ── title ────────────────────────────────────────────────────────────────
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 3) {
      errors.push('title must be a string of at least 3 characters.');
    } else if (body.title.trim().length > 200) {
      errors.push('title cannot exceed 200 characters.');
    } else {
      sanitized.title = body.title.trim();
    }
  } else if (requireAll) {
    errors.push('title is required.');
  }

  // ── description ──────────────────────────────────────────────────────────
  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || body.description.trim().length < 10) {
      errors.push('description must be a string of at least 10 characters.');
    } else if (body.description.trim().length > 5000) {
      errors.push('description cannot exceed 5000 characters.');
    } else {
      sanitized.description = body.description.trim();
    }
  } else if (requireAll) {
    errors.push('description is required.');
  }

  // ── company ──────────────────────────────────────────────────────────────
  if (body.company !== undefined) {
    if (typeof body.company !== 'string' || body.company.trim().length < 2) {
      errors.push('company must be a string of at least 2 characters.');
    } else if (body.company.trim().length > 150) {
      errors.push('company cannot exceed 150 characters.');
    } else {
      sanitized.company = body.company.trim();
    }
  } else if (requireAll) {
    errors.push('company is required.');
  }

  // ── location ─────────────────────────────────────────────────────────────
  if (body.location !== undefined) {
    if (typeof body.location !== 'string' || body.location.trim().length < 2) {
      errors.push('location must be a string of at least 2 characters.');
    } else if (body.location.trim().length > 150) {
      errors.push('location cannot exceed 150 characters.');
    } else {
      sanitized.location = body.location.trim();
    }
  } else if (requireAll) {
    errors.push('location is required.');
  }

  // ── employmentType ───────────────────────────────────────────────────────
  if (body.employmentType !== undefined) {
    if (!VALID_EMPLOYMENT_TYPES.includes(body.employmentType)) {
      errors.push(
        `employmentType must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}.`
      );
    } else {
      sanitized.employmentType = body.employmentType;
    }
  } else if (requireAll) {
    errors.push('employmentType is required.');
  }

  // ── experienceLevel ──────────────────────────────────────────────────────
  if (body.experienceLevel !== undefined) {
    if (!VALID_EXPERIENCE_LEVELS.includes(body.experienceLevel)) {
      errors.push(
        `experienceLevel must be one of: ${VALID_EXPERIENCE_LEVELS.join(', ')}.`
      );
    } else {
      sanitized.experienceLevel = body.experienceLevel;
    }
  } else if (requireAll) {
    errors.push('experienceLevel is required.');
  }

  // ── applicationUrl (optional) ─────────────────────────────────────────────
  if (body.applicationUrl !== undefined) {
    if (body.applicationUrl === null || body.applicationUrl === '') {
      sanitized.applicationUrl = null;
    } else if (typeof body.applicationUrl !== 'string') {
      errors.push('applicationUrl must be a string.');
    } else if (!URL_REGEX.test(body.applicationUrl.trim())) {
      errors.push('applicationUrl must be a valid URL starting with http:// or https://.');
    } else {
      sanitized.applicationUrl = body.applicationUrl.trim();
    }
  }

  // ── deadline (optional) ───────────────────────────────────────────────────
  if (body.deadline !== undefined) {
    if (body.deadline === null || body.deadline === '') {
      sanitized.deadline = null;
    } else {
      const parsed = new Date(body.deadline);
      if (isNaN(parsed.getTime())) {
        errors.push('deadline must be a valid ISO 8601 date string.');
      } else if (parsed <= new Date()) {
        errors.push('deadline must be a future date.');
      } else {
        sanitized.deadline = parsed;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * Validates list/search query parameters for GET /api/jobs.
 */
function validateJobListQuery(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));

  const filters = {};

  if (query.search && typeof query.search === 'string') {
    filters.search = query.search.trim().slice(0, 100);
  }

  if (query.company && typeof query.company === 'string') {
    filters.company = query.company.trim().slice(0, 150);
  }

  if (query.employmentType && VALID_EMPLOYMENT_TYPES.includes(query.employmentType)) {
    filters.employmentType = query.employmentType;
  }

  if (query.experienceLevel && VALID_EXPERIENCE_LEVELS.includes(query.experienceLevel)) {
    filters.experienceLevel = query.experienceLevel;
  }

  return { page, limit, filters };
}

/**
 * Validates a positive integer route parameter (jobId, referralId, etc.)
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
 * Validates a referral status update value.
 * Alumni can only transition to REVIEWED, ACCEPTED, or REJECTED.
 */
function validateReferralStatusUpdate(body) {
  if (!body.status) {
    return { isValid: false, error: 'status is required.' };
  }
  if (!VALID_REFERRAL_STATUSES.includes(body.status)) {
    return {
      isValid: false,
      error: `status must be one of: ${VALID_REFERRAL_STATUSES.join(', ')}.`,
    };
  }
  return { isValid: true, error: null, status: body.status };
}

module.exports = {
  validateJobPost,
  validateJobListQuery,
  validateIntegerId,
  validateReferralStatusUpdate,
  VALID_EMPLOYMENT_TYPES,
  VALID_EXPERIENCE_LEVELS,
};
