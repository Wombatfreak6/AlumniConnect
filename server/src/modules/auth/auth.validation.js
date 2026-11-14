const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const ALLOWED_PUBLIC_ROLES = ['STUDENT', 'ALUMNI'];

function validateRegisterInput({ name, email, password, role }) {
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  } else if (!PASSWORD_REGEX.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
  }

  if (role) {
    if (role === 'ADMIN') {
      errors.push('Registration as ADMIN is prohibited through public registration.');
    } else if (!ALLOWED_PUBLIC_ROLES.includes(role)) {
      errors.push(`Role must be one of the following: [${ALLOWED_PUBLIC_ROLES.join(', ')}].`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      name: name ? name.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      password: password || '',
      role: role && ALLOWED_PUBLIC_ROLES.includes(role) ? role : 'STUDENT',
    },
  };
}

function validateLoginInput({ email, password }) {
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      email: email ? email.trim().toLowerCase() : '',
      password: password || '',
    },
  };
}

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  ALLOWED_PUBLIC_ROLES,
};

