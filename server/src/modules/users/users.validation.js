/**
 * Input validation for User and Profile management
 */

function isValidLinkedInUrl(value) {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    return ['http:', 'https:'].includes(parsed.protocol)
      && (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com'))
      && /^\/(in|company|school)\/[a-zA-Z0-9_%+-]+\/?$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * Validates and sanitizes profile update payload.
 * Strictly prevents modifications to security-critical fields (role, isActive, passwordHash).
 */
function validateProfileUpdate(body) {
  const errors = [];
  const profileData = {};
  let userName = null;

  // Name (User model field)
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long.');
    } else {
      userName = body.name.trim();
    }
  }

  // Profile fields
  const stringFields = ['college', 'branch', 'batch', 'company', 'designation', 'industry'];
  for (const field of stringFields) {
    if (body[field] !== undefined) {
      if (body[field] === null || body[field] === '') {
        profileData[field] = null;
      } else if (typeof body[field] === 'string') {
        profileData[field] = body[field].trim();
      } else {
        errors.push(`${field} must be a string.`);
      }
    }
  }

  // Long text fields
  const textFields = ['bio', 'careerGoals'];
  for (const field of textFields) {
    if (body[field] !== undefined) {
      if (body[field] === null || body[field] === '') {
        profileData[field] = null;
      } else if (typeof body[field] === 'string') {
        if (body[field].length > 1000) {
          errors.push(`${field} cannot exceed 1000 characters.`);
        } else {
          profileData[field] = body[field].trim();
        }
      } else {
        errors.push(`${field} must be a string.`);
      }
    }
  }

  // Graduation Year (Integer)
  if (body.graduationYear !== undefined) {
    if (body.graduationYear === null || body.graduationYear === '') {
      profileData.graduationYear = null;
    } else {
      const year = Number(body.graduationYear);
      if (!Number.isInteger(year) || year < 1950 || year > 2100) {
        errors.push('Graduation year must be a valid 4-digit integer between 1950 and 2100.');
      } else {
        profileData.graduationYear = year;
      }
    }
  }

  // LinkedIn URL
  if (body.linkedinUrl !== undefined) {
    if (body.linkedinUrl === null || body.linkedinUrl === '') {
      profileData.linkedinUrl = null;
    } else if (typeof body.linkedinUrl === 'string') {
      const url = body.linkedinUrl.trim();
      if (!isValidLinkedInUrl(url)) {
        errors.push('Invalid LinkedIn URL format.');
      } else {
        profileData.linkedinUrl = url;
      }
    } else {
      errors.push('LinkedIn URL must be a string.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      profileData,
      userName,
    },
  };
}

/**
 * Validates skill payload for adding a skill to user profile.
 */
function validateSkillInput(body) {
  const errors = [];
  let skillName = null;
  let skillId = null;

  if (body.skillId !== undefined) {
    const id = Number(body.skillId);
    if (!Number.isInteger(id) || id <= 0) {
      errors.push('skillId must be a positive integer.');
    } else {
      skillId = id;
    }
  }

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      errors.push('Skill name must be a non-empty string.');
    } else if (body.name.trim().length > 50) {
      errors.push('Skill name cannot exceed 50 characters.');
    } else {
      skillName = normalizeSkillName(body.name);
    }
  }

  if (!skillName && !skillId) {
    errors.push('Either a valid skill name or skillId must be provided.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      skillName,
      skillId,
    },
  };
}

/**
 * Validates route parameters that must be positive integers.
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
  return {
    isValid: true,
    error: null,
    id,
  };
}

/**
 * Normalizes a skill name by trimming whitespace and formatting capitalization.
 */
function normalizeSkillName(rawName) {
  return rawName
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

module.exports = {
  validateProfileUpdate,
  validateSkillInput,
  validateIntegerId,
  normalizeSkillName,
};
