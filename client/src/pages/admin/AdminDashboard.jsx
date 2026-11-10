import React, { useState, useEffect } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import adminService from '../../services/adminService';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ users: 0, students: 0, alumni: 0, jobPosts: 0, mentorshipRequests: 0, events: 0 });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [togglingId, setTogglingId] = useState(null);

  /**
   * Fetch users from GET /api/admin/users
   */
  const fetchUsers = async (roleFilter = filterRole, searchQuery = search, page = 1) => {
    setTableLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 50,
      };
      if (roleFilter !== 'ALL') {
        params.role = roleFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await adminService.getUsers(params);
      if (response.data) {
        setUsers(response.data.users || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch users directory.');
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([adminService.getUsers({ page: 1, limit: 50 }), adminService.getStats()])
      .then(([response, statsResponse]) => {
        if (!isMounted) return;
        if (statsResponse.data?.stats) setStats(statsResponse.data.stats);
        if (response.data) {
          setUsers(response.data.users || []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch users directory.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRoleFilterChange = (role) => {
    setFilterRole(role);
    fetchUsers(role, search, 1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(filterRole, search, 1);
  };

  /**
   * Toggle user account status via PATCH /api/admin/users/:id/status
   */
  const handleToggleStatus = async (user) => {
    if (user.role === 'ADMIN') {
      setError('Cannot modify the status of a System Administrator account.');
      return;
    }

    setTogglingId(user.id);
    setError(null);
    const newStatus = !user.isActive;

    try {
      const response = await adminService.updateUserStatus(user.id, newStatus);
      const updatedUser = response.data?.user;

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: newStatus, ...(updatedUser || {}) } : u))
      );

      setStatusMessage(
        `User #${user.id} (${user.name}) successfully ${newStatus ? 'activated' : 'deactivated'}.`
      );
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setError(err.message || `Failed to update status for user #${user.id}`);
    } finally {
      setTogglingId(null);
    }
  };

  // Derive actual metrics strictly from live database counts
  const totalUsers = stats.users;

  if (loading) {
    return <Loading text="Loading administration console..." fullScreen={false} />;
  }

  return (
    <div className="dashboard-page admin-dashboard">
      {/* 1. Admin Header & System Status */}
      <div className="dashboard-welcome">
        <div className="welcome-text">
          <div className="welcome-badge-strip">
            <span className="badge badge-admin">CAMPUS GOVERNANCE</span>
            <span className="welcome-verified">Administrative Access</span>
          </div>
          <h1 className="dashboard-page-title">
            Campus Administration Console 🛡️
          </h1>
          <p className="dashboard-page-subtitle">
            Centralized institutional governance, role authorization, and user account verification
          </p>
        </div>
        <div className="system-health-badge">
          <span className="health-dot" />
            <span>Live platform statistics</span>
        </div>
      </div>

      {/* Status or Error Notice */}
      {statusMessage && (
        <div className="dashboard-alert-banner" role="status">
          <span>✅ {statusMessage}</span>
        </div>
      )}

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      {/* 2. Platform Overview Metrics (Derived strictly from live database counts) */}
      <section className="stats-grid">
        <StatCard
          title="Total Registered"
          value={totalUsers}
          subtitle="Verified collegiate accounts"
          icon="👥"
          variant="primary"
        />
        <StatCard
          title="Student Accounts"
          value={stats.students}
          subtitle="Enrolled undergraduates"
          icon="🎒"
          variant="neutral"
        />
        <StatCard
          title="Alumni Accounts"
          value={stats.alumni}
          subtitle="Graduated industry members"
          icon="🎓"
          variant="success"
        />
        <StatCard
          title="Jobs · Mentorship · Events"
          value={`${stats.jobPosts} · ${stats.mentorshipRequests} · ${stats.events}`}
          subtitle="Total platform activity"
          icon="🛡️"
          variant="warning"
        />
      </section>

      {/* 3. User Management Interface (Connected to Live Backend APIs) */}
      <section id="users">
        <Card
          title="Collegiate User Directory"
          subtitle="Audit, search, and manage account statuses across all registered users"
        >
          {/* Search and Filters Controls */}
          <div className="admin-controls-bar">
            <form onSubmit={handleSearchSubmit} className="admin-search-wrapper">
              <Input
                placeholder="Search by name or email (press Enter)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            <div className="admin-role-tabs">
              {['ALL', 'STUDENT', 'ALUMNI', 'ADMIN'].map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`admin-filter-pill ${filterRole === role ? 'active' : ''}`}
                  onClick={() => handleRoleFilterChange(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Table */}
          {tableLoading ? (
            <Loading text="Updating directory..." fullScreen={false} />
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User & Email</th>
                    <th>Role</th>
                    <th>Institution</th>
                    <th>Registered</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-6 text-muted">
                        No users match the selected query criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="user-id">#{user.id}</td>
                        <td>
                          <div className="user-cell">
                            <span className="user-cell-name">{user.name}</span>
                            <span className="user-cell-email">{user.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${user.role.toLowerCase()}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="institution-cell">
                          {user.profile?.college || 'Not specified'}
                        </td>
                        <td className="date-cell">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <span
                            className={`status-pill-dot ${
                              user.isActive ? 'active' : 'inactive'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td>
                          {user.role !== 'ADMIN' ? (
                            <Button
                              variant={user.isActive ? 'outline' : 'primary'}
                              size="sm"
                              isLoading={togglingId === user.id}
                              onClick={() => handleToggleStatus(user)}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          ) : (
                            <span className="text-muted text-xs font-semibold">System Admin</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      {/* 4. Activity & Security Overview */}
      <section id="security">
        <Card title="Security & Architecture Overview">
          <div className="security-summary-grid">
            <div className="security-metric">
              <span className="metric-label">RBAC Protocol</span>
              <span className="metric-detail">Strict `authorizeRoles(&apos;ADMIN&apos;)` middleware enforcement</span>
            </div>
            <div className="security-metric">
              <span className="metric-label">Token Transport</span>
              <span className="metric-detail">Secure HttpOnly Cookie with SameSite protection</span>
            </div>
            <div className="security-metric">
              <span className="metric-label">Public Registration</span>
              <span className="metric-detail">Public registration restricted to STUDENT & ALUMNI only</span>
            </div>
            <div className="security-metric">
              <span className="metric-label">Database ORM</span>
              <span className="metric-detail">PostgreSQL 16 via Prisma ORM 7 Driver Adapter</span>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
