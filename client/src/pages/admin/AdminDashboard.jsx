import React, { useState } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
  mockAdminStats,
  mockAdminUsers,
} from '../../services/mockData';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [users, setUsers] = useState(mockAdminUsers);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [statusMessage, setStatusMessage] = useState(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleToggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus = !u.isActive;
          setStatusMessage(
            `User #${id} (${u.name}) account ${newStatus ? 'activated' : 'deactivated'}.`
          );
          setTimeout(() => setStatusMessage(null), 3500);
          return { ...u, isActive: newStatus };
        }
        return u;
      })
    );
  };

  return (
    <div className="dashboard-page admin-dashboard">
      {/* Header */}
      <div className="dashboard-welcome">
        <div className="welcome-text">
          <h1 className="dashboard-page-title">
            Campus Administration Console 🛡️
          </h1>
          <p className="dashboard-page-subtitle">
            Centralized institutional governance, role authorization, and user account verification
          </p>
        </div>
        <div className="system-health-badge">
          <span className="health-dot" />
          <span>System Status: Healthy</span>
        </div>
      </div>

      {statusMessage && (
        <div className="dashboard-alert-banner">
          <span>ℹ️ {statusMessage}</span>
        </div>
      )}

      {/* Metrics Strip */}
      <section className="stats-grid">
        {mockAdminStats.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            variant={stat.variant}
          />
        ))}
      </section>

      {/* User Directory Management Card */}
      <section id="users">
        <Card
          title="Collegiate User Directory"
          subtitle="Audit, search, and toggle active status across student and alumni accounts"
        >
          {/* Controls bar */}
          <div className="admin-controls-bar">
            <div className="admin-search-wrapper">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="admin-role-tabs">
              {['ALL', 'STUDENT', 'ALUMNI', 'ADMIN'].map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`admin-filter-pill ${filterRole === role ? 'active' : ''}`}
                  onClick={() => setFilterRole(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Table */}
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User & Email</th>
                  <th>Role</th>
                  <th>Institution</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-6 text-muted">
                      No matching user records found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="user-id">#{user.id}</td>
                      <td>
                        <div className="user-cell">
                          <span className="user-cell-name">{user.name}</span>
                          <span className="user-cell-email">{user.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge role-${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="institution-cell">{user.college}</td>
                      <td className="date-cell">{user.joinedDate}</td>
                      <td>
                        <span
                          className={`status-pill-dot ${
                            user.isActive ? 'active' : 'inactive'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        {user.role !== 'ADMIN' ? (
                          <Button
                            variant={user.isActive ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() => handleToggleStatus(user.id)}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        ) : (
                          <span className="text-muted text-xs">System Admin</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Backend Integration Info Box */}
      <section id="security">
        <Card title="Institutional Audit & RBAC Architecture">
          <div className="security-summary-grid">
            <div className="security-metric">
              <span className="metric-label">RBAC Protocol</span>
              <span className="metric-detail">Strict `authorizeRoles(&apos;ADMIN&apos;)` backend middleware</span>
            </div>
            <div className="security-metric">
              <span className="metric-label">Token Transport</span>
              <span className="metric-detail">HttpOnly Cookie with SameSite protection</span>
            </div>
            <div className="security-metric">
              <span className="metric-label">Public Registration</span>
              <span className="metric-detail">Locked to STUDENT and ALUMNI roles only</span>
            </div>
            <div className="security-metric">
              <span className="metric-label">Database ORM</span>
              <span className="metric-detail">PostgreSQL 16 via Prisma Client Adapter</span>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
