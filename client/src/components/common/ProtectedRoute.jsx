import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Loading from './Loading';
import { getDefaultDashboardPath } from '../../utils/navigation';

/**
 * ProtectedRoute Component
 * Guards private pages against unauthenticated access and enforces role restrictions.
 *
 * @param {{ allowedRoles?: string[], children?: React.ReactNode }} props
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading text="Verifying authentication session..." fullScreen />;
  }

  // If user is not authenticated, redirect to /login and preserve previous location
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, enforce role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(user.role) || (user.role === 'ADMIN' && allowedRoles.includes('ADMIN'));

    if (!hasRole) {
      // Redirect user to their own valid portal
      const targetPath = getDefaultDashboardPath(user.role);
      return <Navigate to={targetPath} replace />;
    }
  }

  return children ? children : <Outlet />;
}

/**
 * PublicOnlyRoute Component
 * Prevents authenticated users from seeing Login/Register pages, redirecting them to their dashboard.
 */
export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading text="Loading..." fullScreen />;
  }

  if (user) {
    const targetPath = getDefaultDashboardPath(user.role);
    return <Navigate to={targetPath} replace />;
  }

  return children ? children : <Outlet />;
}
