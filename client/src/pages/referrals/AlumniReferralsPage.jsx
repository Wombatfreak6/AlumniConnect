import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobService from '../../services/jobService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import './Referrals.css';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending Review',
    className: 'status-pending',
    icon: '⏳',
    badgeText: 'Needs Review',
  },
  REVIEWED: {
    label: 'Under Review',
    className: 'status-reviewed',
    icon: '👀',
    badgeText: 'In Progress',
  },
  ACCEPTED: {
    label: 'Accepted',
    className: 'status-accepted',
    icon: '✅',
    badgeText: 'Referred',
  },
  REJECTED: {
    label: 'Not Selected',
    className: 'status-rejected',
    icon: '✕',
    badgeText: 'Declined',
  },
};

export default function AlumniReferralsPage() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successFeedback, setSuccessFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    jobService
      .getAlumniReferrals()
      .then((res) => {
        if (!isMounted) return;
        setReferrals(res?.data?.referrals || []);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load received referral requests.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const handleUpdateStatus = async (referralId, newStatus, studentName) => {
    setUpdatingId(referralId);
    setError(null);
    setSuccessFeedback(null);
    try {
      const res = await jobService.updateReferralStatus(referralId, newStatus);
      if (res?.success) {
        // Update the row locally instead of refetching the whole list.
        setReferrals((prev) =>
          prev.map((r) =>
            r.id === referralId ? { ...r, status: newStatus } : r
          )
        );
        const actionLabel =
          newStatus === 'ACCEPTED'
            ? 'accepted'
            : newStatus === 'REJECTED'
            ? 'declined'
            : 'marked as under review';
        setSuccessFeedback(
          `Successfully ${actionLabel} the referral request for ${studentName || 'student'}.`
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to update referral status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const filteredReferrals = referrals.filter((ref) => {
    if (activeTab === 'ALL') return true;
    return ref.status === activeTab;
  });

  const counts = {
    ALL: referrals.length,
    PENDING: referrals.filter((r) => r.status === 'PENDING').length,
    REVIEWED: referrals.filter((r) => r.status === 'REVIEWED').length,
    ACCEPTED: referrals.filter((r) => r.status === 'ACCEPTED').length,
    REJECTED: referrals.filter((r) => r.status === 'REJECTED').length,
  };

  return (
    <div className="referrals-page container">
      <div className="referrals-header">
        <div>
          <h1 className="referrals-title">
            <span>📥</span> Referral Requests Received
          </h1>
          <p className="referrals-subtitle">
            Review applicant profiles, evaluate skill alignments, and grant internal referrals for your posted opportunities.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              setError(null);
              setReloadKey((key) => key + 1);
            }}
          >
            🔄 Refresh
          </Button>
          <Link to="/jobs/my">
            <Button variant="secondary" size="sm">
              📋 My Posted Jobs
            </Button>
          </Link>
          <Link to="/jobs/create">
            <Button variant="primary" size="sm">
              + Post New Job
            </Button>
          </Link>
        </div>
      </div>

      {successFeedback && (
        <div
          style={{
            backgroundColor: 'var(--color-success-bg, #ecfdf5)',
            border: '1px solid var(--color-success-border, #10b981)',
            color: 'var(--color-success, #065f46)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>✓ {successFeedback}</span>
          <button
            type="button"
            onClick={() => setSuccessFeedback(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <ErrorAlert message={error} />
      )}

      <div className="referrals-tabs">
        <button
          className={`referral-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          All Incoming <span className="tab-badge">{counts.ALL}</span>
        </button>
        <button
          className={`referral-tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
          onClick={() => setActiveTab('PENDING')}
        >
          Pending Review <span className="tab-badge">{counts.PENDING}</span>
        </button>
        <button
          className={`referral-tab-btn ${activeTab === 'REVIEWED' ? 'active' : ''}`}
          onClick={() => setActiveTab('REVIEWED')}
        >
          Under Review <span className="tab-badge">{counts.REVIEWED}</span>
        </button>
        <button
          className={`referral-tab-btn ${activeTab === 'ACCEPTED' ? 'active' : ''}`}
          onClick={() => setActiveTab('ACCEPTED')}
        >
          Accepted <span className="tab-badge">{counts.ACCEPTED}</span>
        </button>
        <button
          className={`referral-tab-btn ${activeTab === 'REJECTED' ? 'active' : ''}`}
          onClick={() => setActiveTab('REJECTED')}
        >
          Declined <span className="tab-badge">{counts.REJECTED}</span>
        </button>
      </div>

      {loading ? (
        <Loading message="Loading received referral requests..." fullScreen={false} />
      ) : filteredReferrals.length === 0 ? (
        <Card className="empty-state-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>📬</div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>
            {activeTab === 'ALL'
              ? 'No Referral Requests Received'
              : `No requests currently marked as ${activeTab.toLowerCase()}`}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', maxWidth: '460px', marginInline: 'auto' }}>
            {activeTab === 'ALL'
              ? 'When students find your job postings and request internal referrals, their candidate profiles will appear here for your review.'
              : `You do not have any candidate requests in the ${activeTab.toLowerCase()} stage.`}
          </p>
          <Link to="/jobs/my">
            <Button variant="outline">View Your Job Postings</Button>
          </Link>
        </Card>
      ) : (
        <div className="referrals-grid">
          {filteredReferrals.map((referral) => {
            const job = referral.jobPost || {};
            const student = referral.student || {};
            const profile = student.profile || {};
            const skills = student.skills || [];
            const statusMeta = STATUS_CONFIG[referral.status] || STATUS_CONFIG.PENDING;
            const isProcessing = updatingId === referral.id;

            return (
              <div key={referral.id} className="referral-card">
                <div className="referral-card-top">
                  <div>
                    <h3 className="referral-subject-title">
                      {student.name || 'Student Candidate'}
                    </h3>
                    <div className="referral-subject-sub">
                      Applied for:{' '}
                      {job.id ? (
                        <Link
                          to={`/jobs/${job.id}`}
                          style={{
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--color-primary)',
                            textDecoration: 'none',
                          }}
                        >
                          <strong>{job.title}</strong>
                        </Link>
                      ) : (
                        <strong>{job.title || 'Job Post'}</strong>
                      )}{' '}
                      at <strong>{job.company || 'Your Company'}</strong>
                    </div>
                  </div>

                  <span className={`ref-status-badge ${statusMeta.className}`}>
                    <span>{statusMeta.icon}</span> {statusMeta.label}
                  </span>
                </div>

                {/* Candidate Profile Details Snapshot */}
                <div className="student-snapshot-box">
                  <div className="snapshot-meta-row">
                    {profile.college && (
                      <span>🎓 <strong>{profile.college}</strong></span>
                    )}
                    {profile.branch && (
                      <span>📚 {profile.branch}</span>
                    )}
                    {profile.graduationYear && (
                      <span>🗓️ Class of {profile.graduationYear}</span>
                    )}
                    {profile.batch && (
                      <span>🏷️ Batch: {profile.batch}</span>
                    )}
                    {student.email && (
                      <span>✉️ <a href={`mailto:${student.email}`} style={{ color: 'inherit' }}>{student.email}</a></span>
                    )}
                    {profile.linkedinUrl && (
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--color-primary)',
                          textDecoration: 'none',
                          fontWeight: 'var(--font-weight-medium)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        🔗 LinkedIn Profile
                      </a>
                    )}
                  </div>

                  {/* Skills tags */}
                  {skills.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-subtle)',
                          marginBottom: 'var(--space-1)',
                          fontWeight: 'var(--font-weight-semibold)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Verified Skills:
                      </div>
                      <div className="snapshot-skills-strip">
                        {skills.map((s) => (
                          <span key={s.id || s.name} className="ref-skill-pill">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Career Goals or Bio if available */}
                  {profile.careerGoals && (
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      <strong>Career Goals:</strong> {profile.careerGoals}
                    </div>
                  )}
                  {profile.bio && (
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      <strong>Bio:</strong> {profile.bio}
                    </div>
                  )}
                </div>

                {/* Request Message */}
                {referral.message ? (
                  <div className="referral-message-callout">
                    <span className="callout-label">Student Introduction & Pitch:</span>
                    "{referral.message}"
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                      fontStyle: 'italic',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    (No custom introduction note provided by applicant)
                  </div>
                )}

                {/* Card Bottom: Timestamp & Action Buttons */}
                <div className="referral-card-bottom">
                  <div className="referral-date-text">
                    Received on {formatDate(referral.createdAt)} • Status:{' '}
                    <strong>{statusMeta.label}</strong>
                  </div>

                  <div className="referral-action-buttons">
                    {referral.status === 'PENDING' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() =>
                            handleUpdateStatus(referral.id, 'REVIEWED', student.name)
                          }
                        >
                          👁️ Mark as Reviewed
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() =>
                            handleUpdateStatus(referral.id, 'REJECTED', student.name)
                          }
                        >
                          ✕ Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() =>
                            handleUpdateStatus(referral.id, 'ACCEPTED', student.name)
                          }
                        >
                          ✓ Accept Request
                        </Button>
                      </>
                    )}

                    {referral.status === 'REVIEWED' && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() =>
                            handleUpdateStatus(referral.id, 'REJECTED', student.name)
                          }
                        >
                          ✕ Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() =>
                            handleUpdateStatus(referral.id, 'ACCEPTED', student.name)
                          }
                        >
                          ✓ Accept Request
                        </Button>
                      </>
                    )}

                    {referral.status === 'ACCEPTED' && (
                      <span
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-success)',
                          fontWeight: 'var(--font-weight-semibold)',
                        }}
                      >
                        ✓ Request Accepted
                      </span>
                    )}

                    {referral.status === 'REJECTED' && (
                      <span
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        ✕ Request Declined
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
