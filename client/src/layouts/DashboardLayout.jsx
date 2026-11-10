import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import useAuth from '../hooks/useAuth';
import './DashboardLayout.css';

/**
 * Common Dashboard Layout
 * Shared layout for Student, Alumni, and Admin portals.
 */
export default function DashboardLayout({ defaultRole }) {
  const location = useLocation();
  const { user } = useAuth();

  // Infer active role: route-specific overrides or authenticated user role
  let currentRole = defaultRole;
  if (!currentRole) {
    if (
      location.pathname.startsWith('/alumni') ||
      location.pathname.startsWith('/referrals/received') ||
      location.pathname.startsWith('/jobs/my') ||
      location.pathname.startsWith('/jobs/create')
    ) {
      currentRole = 'ALUMNI';
    } else if (location.pathname.startsWith('/admin')) {
      currentRole = 'ADMIN';
    } else if (
      location.pathname.startsWith('/student') ||
      location.pathname.startsWith('/referrals/my')
    ) {
      currentRole = 'STUDENT';
    } else {
      currentRole = user?.role || 'STUDENT';
    }
  }

  // Sidebar navigation presets per role
  const sidebarConfigs = {
    STUDENT: {
      title: 'Student Hub',
      items: [
        { label: 'Overview', path: '/student', icon: '📊', exact: true },
        { label: 'Job Opportunities', path: '/jobs', icon: '💼' },
        { label: 'My Referrals', path: '/referrals/my', icon: '🤝' },
        { label: 'Find Mentors', path: '/student#mentors', icon: '🎓', badge: '3 Available' },
        { label: 'My Profile', path: '/profile', icon: '👤' },
      ],
    },
    ALUMNI: {
      title: 'Alumni Portal',
      items: [
        { label: 'Overview', path: '/alumni', icon: '📊', exact: true },
        { label: 'Job Board', path: '/jobs', icon: '💼' },
        { label: 'My Job Postings', path: '/jobs/my', icon: '📋' },
        { label: 'Referral Requests', path: '/referrals/received', icon: '📥' },
        { label: 'Mentorship Requests', path: '/alumni#requests', icon: '🎓', badge: '2 Pending' },
        { label: 'Public Profile', path: '/profile', icon: '👤' },
      ],
    },
    ADMIN: {
      title: 'Admin Console',
      items: [
        { label: 'Platform Metrics', path: '/admin', icon: '📈', exact: true },
        { label: 'Job Board', path: '/jobs', icon: '💼' },
        { label: 'User Directory', path: '/admin#users', icon: '👥' },
        { label: 'Access Control', path: '/admin#security', icon: '🛡️' },
        { label: 'Admin Profile', path: '/profile', icon: '👤' },
      ],
    },
  };

  const activeConfig = sidebarConfigs[currentRole] || sidebarConfigs.STUDENT;

  return (
    <div className="dashboard-shell">
      <Navbar />
      <div className="dashboard-container container">
        <Sidebar
          role={currentRole}
          title={activeConfig.title}
          items={activeConfig.items}
        />
        <main className="dashboard-content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
