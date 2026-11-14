import React, { useState, useEffect } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import adminService from '../../services/adminService';
import jobService from '../../services/jobService';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ users: 0, students: 0, alumni: 0, jobPosts: 0, mentorshipRequests: 0, events: 0 });
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [reloadKey, setReloadKey] = useState(0);
  const [togglingId, setTogglingId] = useState(null);
  const [moderatingJobId, setModeratingJobId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([adminService.getStats(), jobService.getJobs({ page: 1, limit: 5 })])
      .then(([statsResponse, jobsResponse]) => {
        if (!isMounted) return;
        if (statsResponse.data?.stats) setStats(statsResponse.data.stats);
        setJobs(jobsResponse.data?.jobs || []);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load dashboard metrics.');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const params = { page, limit: 50 };
    if (filterRole !== 'ALL') params.role = filterRole;
    if (activeSearch) params.search = activeSearch;

    adminService
      .getUsers(params)
      .then((response) => {
        if (!isMounted || !response.data) return;
        setUsers(response.data.users || []);
        setPagination(
          response.data.pagination || {
            total: response.data.users.length,
            page,
            limit: 50,
            totalPages: 1,
          }
        );
        setError(null);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to fetch users directory.');
      })
      .finally(() => {
        if (isMounted) {
          setTableLoading(false);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filterRole, activeSearch, page, reloadKey]);

  const handleModerateJob = async (jobId) => {
    if (!window.confirm('Delete this job post? Any referral history attached to it will also be deleted.')) return;
    setModeratingJobId(jobId);
    try {
      await jobService.deleteJob(jobId);
      setJobs((current) => current.filter((job) => job.id !== jobId));
      setStats((current) => ({ ...current, jobPosts: Math.max(0, current.jobPosts - 1) }));
    } catch (err) {
      setError(err.message || 'Failed to moderate job post.');
    } finally {
      setModeratingJobId(null);
    }
  };

  const handleRoleFilterChange = (role) => {
    setFilterRole(role);
    setPage(1);
    setTableLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(search.trim());
    setPage(1);
    setTableLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  };

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

  const totalUsers = stats.users;

  if (loading) {
    return <Loading message="Loading administration console..." fullScreen={false} />;
  }

  return (
    <div className="dashboard-page admin-dashboard">
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

      {statusMessage && (
        <div className="dashboard-alert-banner" role="status">
          <span>✅ {statusMessage}</span>
        </div>
      )}

      {error && (
        <ErrorAlert message={error} />
      )}

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
        <StatCard title="Job Posts" value={stats.jobPosts} subtitle="Published opportunities" icon="💼" variant="warning" />
        <StatCard title="Mentorship Requests" value={stats.mentorshipRequests} subtitle="All request statuses" icon="🎓" variant="primary" />
        <StatCard title="Events" value={stats.events} subtitle="Published events" icon="📅" variant="neutral" />
      </section>

      <section id="jobs">
        <Card title="Job moderation" subtitle="Review recent listings or remove inappropriate posts">
          {jobs.length === 0 ? <p className="text-muted">No job posts to review.</p> : <div className="community-list">{jobs.map((job) => <article className="community-row" key={job.id}><div><h3><Link to={`/jobs/${job.id}`}>{job.title}</Link></h3><p>{job.company} · {job.location} · Posted by {job.postedBy?.name || 'Alumni'}</p></div><div className="community-actions-inline"><Link to={`/jobs/${job.id}/edit`}><Button variant="outline" size="sm">Edit</Button></Link><Button variant="danger" size="sm" isLoading={moderatingJobId === job.id} onClick={() => handleModerateJob(job.id)}>Delete</Button></div></article>)}</div>}
          <Link to="/jobs" className="community-link">Open job board →</Link>
        </Card>
      </section>

      <section id="users">
        <Card
          title="Collegiate User Directory"
          subtitle="Audit, search, and manage account statuses across all registered users"
        >
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

          {tableLoading ? (
            <Loading message="Updating directory..." fullScreen={false} />
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
          <div className="admin-pagination" aria-label="User directory pagination">
            <span>Page {pagination.page} of {pagination.totalPages} · {pagination.total} users</span>
            <div className="community-actions-inline">
              <Button size="sm" variant="outline" disabled={page <= 1 || tableLoading} onClick={() => {
                setTableLoading(true);
                setPage((current) => Math.max(1, current - 1));
              }}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= pagination.totalPages || tableLoading} onClick={() => {
                setTableLoading(true);
                setPage((current) => current + 1);
              }}>Next</Button>
            </div>
          </div>
        </Card>
      </section>

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
