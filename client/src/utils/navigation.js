/**
 * Navigation and role routing helpers
 */

/**
 * Returns the default dashboard destination for a user role
 * @param {string} role 'STUDENT' | 'ALUMNI' | 'ADMIN'
 * @returns {string} Route path
 */
export function getDefaultDashboardPath(role) {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'ALUMNI':
      return '/alumni';
    case 'STUDENT':
    default:
      return '/student';
  }
}
