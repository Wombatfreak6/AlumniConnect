import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobService from '../../services/jobService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import './Jobs.css';

export default function MyJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    jobService
      .getMyJobs()
      .then((res) => {
        if (!isMounted) return;
        if (res?.data?.jobs) {
          setJobs(res.data.jobs);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to retrieve your job postings.');
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

  const handleDelete = async (jobId) => {
    setDeletingId(jobId);
    try {
      await jobService.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err.message || 'Failed to delete job post.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <Loading message="Loading your posted opportunities..." fullScreen={false} />;
  }

  return (
    <div className="jobs-page container">
      <div className="jobs-header">
        <div className="jobs-header-main">
          <div className="badge-strip" style={{ marginBottom: 'var(--space-2)' }}>
            <span className="badge badge-alumni">ALUMNI MANAGEMENT</span>
          </div>
          <h1 className="jobs-title">
            <span>📋</span> My Job & Internship Postings
          </h1>
          <p className="jobs-subtitle">
            Manage your published job opportunities and track incoming student referral applications.
          </p>
        </div>

        <div className="jobs-header-actions">
          <Link to="/jobs">
            <Button variant="outline" size="md">
              Browse Job Board
            </Button>
          </Link>
          <Link to="/jobs/create">
            <Button variant="primary" size="md">
              + Post New Opportunity
            </Button>
          </Link>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {jobs.length === 0 ? (
        <div className="jobs-empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            📝
          </span>
          <h3 className="empty-state-title">You haven't posted any jobs yet</h3>
          <p className="empty-state-desc">
            Help connect fellow collegiate talent with hiring teams at your organization by publishing your first job or internship posting.
          </p>
          <Link to="/jobs/create">
            <Button variant="primary">+ Post Your First Job</Button>
          </Link>
        </div>
      ) : (
        <Card title={`Active Postings (${jobs.length})`} subtitle="Overview of opportunities published by your alumni account">
          <div className="my-jobs-table-container">
            <table className="my-jobs-table">
              <thead>
                <tr>
                  <th>Job Title & Organization</th>
                  <th>Location</th>
                  <th>Type & Level</th>
                  <th>Referral Inquiries</th>
                  <th>Published Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const summary = job.referralSummary || {
                    PENDING: 0,
                    REVIEWED: 0,
                    ACCEPTED: 0,
                    REJECTED: 0,
                  };
                  const totalReferrals =
                    summary.PENDING + summary.REVIEWED + summary.ACCEPTED + summary.REJECTED;

                  const isConfirming = confirmDeleteId === job.id;

                  return (
                    <tr key={job.id}>
                      <td>
                        <strong style={{ display: 'block', fontSize: 'var(--font-size-base)', color: 'var(--color-primary)' }}>
                          {job.title}
                        </strong>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                          🏢 {job.company}
                        </span>
                      </td>

                      <td>📍 {job.location || 'Remote'}</td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                            {job.employmentType?.replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
                            {job.experienceLevel} Level
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="status-summary-pills">
                          {totalReferrals === 0 ? (
                            <span style={{ color: 'var(--color-text-subtle)', fontSize: 'var(--font-size-xs)' }}>
                              0 Inquiries
                            </span>
                          ) : (
                            <>
                              {summary.PENDING > 0 && (
                                <span className="pill-count pill-pending" title="Pending Inquiries">
                                  {summary.PENDING} Pending
                                </span>
                              )}
                              {summary.REVIEWED > 0 && (
                                <span className="pill-count pill-reviewed" title="Reviewed Inquiries">
                                  {summary.REVIEWED} In Review
                                </span>
                              )}
                              {summary.ACCEPTED > 0 && (
                                <span className="pill-count pill-accepted" title="Accepted Referrals">
                                  {summary.ACCEPTED} Accepted
                                </span>
                              )}
                              {summary.REJECTED > 0 && (
                                <span className="pill-count pill-rejected" title="Declined">
                                  {summary.REJECTED} Rejected
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                        {job.createdAt
                          ? new Date(job.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {isConfirming ? (
                          <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              isLoading={deletingId === job.id}
                              onClick={() => handleDelete(job.id)}
                            >
                              Confirm
                            </Button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                            <Link to={`/jobs/${job.id}`}>
                              <Button variant="ghost" size="sm" title="View details">
                                👁️ View
                              </Button>
                            </Link>
                            <Link to={`/jobs/${job.id}/edit`}>
                              <Button variant="outline" size="sm" title="Edit posting">
                                ✏️ Edit
                              </Button>
                            </Link>
                            <Button
                              variant="danger"
                              size="sm"
                              title="Delete posting"
                              onClick={() => setConfirmDeleteId(job.id)}
                            >
                              🗑️
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
