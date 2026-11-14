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
