const ALLOWED_ROLES = ['STUDENT', 'ALUMNI', 'ADMIN'];

function validateUserListQuery(query) {
  let page = Number(query.page);
  if (!Number.isInteger(page) || page <= 0) {
    page = 1;
  }

  let limit = Number(query.limit);
  if (!Number.isInteger(limit) || limit <= 0) {
    limit = 10;
  } else if (limit > 100) {
    limit = 100;
  }

  let role = null;
  if (query.role && typeof query.role === 'string') {
    const upper = query.role.trim().toUpperCase();
    if (ALLOWED_ROLES.includes(upper)) {
      role = upper;
    }
  }

  let isActive = null;
  if (query.status !== undefined) {
    const s = String(query.status).toLowerCase();
    if (s === 'active' || s === 'true') {
      isActive = true;
    } else if (s === 'inactive' || s === 'false') {
      isActive = false;
    }
  }

  const search = query.search && typeof query.search === 'string' ? query.search.trim() : '';

  return {
    page,
    limit,
    role,
    isActive,
    search,
  };
}

function validateStatusUpdate(body) {
  if (body.isActive === undefined || typeof body.isActive !== 'boolean') {
    return {
      isValid: false,
      error: 'Field "isActive" is required and must be a boolean (true or false).',
      isActive: null,
    };
  }

  return {
    isValid: true,
    error: null,
    isActive: body.isActive,
  };
}

module.exports = {
  validateUserListQuery,
  validateStatusUpdate,
};
