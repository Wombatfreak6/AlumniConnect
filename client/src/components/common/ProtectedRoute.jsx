import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Loading from './Loading';
import { getDefaultDashboardPath } from '../../utils/navigation';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading message="Verifying authentication session..." fullScreen />;
  }

  // If user is not authenticated, redirect to /login and preserve previous location
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultDashboardPath(user.role)} replace />;
  }

  return children ? children : <Outlet />;
}

export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading message="Loading..." fullScreen />;
  }

  if (user) {
    const targetPath = getDefaultDashboardPath(user.role);
    return <Navigate to={targetPath} replace />;
  }

  return children ? children : <Outlet />;
}
