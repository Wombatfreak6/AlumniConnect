import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';
import useAuth from '../hooks/useAuth';
import './DashboardLayout.css';

export default function DashboardLayout({ defaultRole }) {
  const location = useLocation();
  const { user } = useAuth();

  // Admins keep the admin console when they open shared pages.
  let currentRole = user?.role === 'ADMIN' ? 'ADMIN' : defaultRole;
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
      location.pathname.startsWith('/referrals/my') ||
      location.pathname.startsWith('/network/matches')
    ) {
      currentRole = 'STUDENT';
    } else {
      currentRole = user?.role || 'STUDENT';
    }
  }

  const sidebarConfigs = {
    STUDENT: {
      title: 'Student Hub',
      items: [
        { label: 'Overview', path: '/student', icon: '📊', exact: true },
        { label: 'Smart Matches', path: '/network/matches', icon: '⚡', badge: 'AI' },
        { label: 'Job Opportunities', path: '/jobs', icon: '💼' },
        { label: 'My Referrals', path: '/referrals/my', icon: '🤝' },
        { label: 'Find Mentors', path: '/mentorship', icon: '🎓' },
        { label: 'Events', path: '/events', icon: '📅' },
        { label: 'My Events', path: '/events/my', icon: '🗓️' },
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
        { label: 'Mentorship', path: '/mentorship/manage', icon: '🎓' },
        { label: 'Events', path: '/events', icon: '📅' },
        { label: 'My Events', path: '/events/my', icon: '🗓️' },
        { label: 'Public Profile', path: '/profile', icon: '👤' },
      ],
    },
    ADMIN: {
      title: 'Admin Console',
      items: [
        { label: 'Platform Metrics', path: '/admin', icon: '📈', exact: true },
        { label: 'Job Board', path: '/jobs', icon: '💼' },
        { label: 'Mentorship Activity', path: '/mentorship/requests', icon: '🎓' },
        { label: 'Events', path: '/events', icon: '📅' },
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
