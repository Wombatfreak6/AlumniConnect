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
import JobBoardPage from './pages/jobs/JobBoardPage';
import JobDetailsPage from './pages/jobs/JobDetailsPage';
import CreateJobPage from './pages/jobs/CreateJobPage';
import EditJobPage from './pages/jobs/EditJobPage';
import MyJobsPage from './pages/jobs/MyJobsPage';
import StudentReferralsPage from './pages/referrals/StudentReferralsPage';
import AlumniReferralsPage from './pages/referrals/AlumniReferralsPage';
import RecommendationsPage from './pages/network/RecommendationsPage';
import NotFoundPage from './pages/NotFoundPage';
import {
  MentorshipPage,
  MentorshipDetailsPage,
  MentorshipManagePage,
  EventsPage,
  EventFormPage,
  EventDetailsPage,
  MyEventsPage,
} from './pages/community/CommunityPages';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route element={<PublicOnlyRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']} />}>
            <Route element={<DashboardLayout defaultRole="STUDENT" />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/referrals/my" element={<StudentReferralsPage />} />
              <Route path="/network/matches" element={<RecommendationsPage />} />
              <Route path="/mentorship/requests" element={<MentorshipManagePage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ALUMNI', 'ADMIN']} />}>
            <Route element={<DashboardLayout defaultRole="ALUMNI" />}>
              <Route path="/alumni" element={<AlumniDashboard />} />
              <Route path="/mentorship/manage" element={<MentorshipManagePage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<DashboardLayout defaultRole="ADMIN" />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ALUMNI', 'ADMIN']} />}>
            <Route element={<DashboardLayout defaultRole="ALUMNI" />}>
              <Route path="/jobs/create" element={<CreateJobPage />} />
              <Route path="/jobs/my" element={<MyJobsPage />} />
              <Route path="/jobs/:id/edit" element={<EditJobPage />} />
              <Route path="/referrals/received" element={<AlumniReferralsPage />} />
              <Route path="/events/create" element={<EventFormPage />} />
              <Route path="/events/:id/edit" element={<EventFormPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/jobs" element={<JobBoardPage />} />
              <Route path="/jobs/:id" element={<JobDetailsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/mentorship" element={<MentorshipPage />} />
              <Route path="/mentorship/slots/:id" element={<MentorshipDetailsPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/my" element={<MyEventsPage />} />
              <Route path="/events/:id" element={<EventDetailsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
