import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { PublicOnlyRoute } from './components/common/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import AlumniDashboard from './pages/alumni/AlumniDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProfilePage from './pages/profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Informational Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Guest-only Auth Routes: Redirects logged-in users to their portal */}
          <Route element={<PublicOnlyRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
          </Route>

          {/* Protected Student Portal: Accessible by STUDENT and ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']} />}>
            <Route element={<DashboardLayout defaultRole="STUDENT" />}>
              <Route path="/student" element={<StudentDashboard />} />
            </Route>
          </Route>

          {/* Protected Alumni Portal: Accessible by ALUMNI and ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ALUMNI', 'ADMIN']} />}>
            <Route element={<DashboardLayout defaultRole="ALUMNI" />}>
              <Route path="/alumni" element={<AlumniDashboard />} />
            </Route>
          </Route>

          {/* Protected Admin Console: Strictly ADMIN only */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<DashboardLayout defaultRole="ADMIN" />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* Protected Profile: Accessible by any authenticated role */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
