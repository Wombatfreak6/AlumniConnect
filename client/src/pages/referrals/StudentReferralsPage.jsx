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
    desc: 'Waiting for the alumni member to review your request.',
  },
  REVIEWED: {
    label: 'Under Review',
    className: 'status-reviewed',
    icon: '👀',
    desc: 'The alumnus has opened and reviewed your profile.',
  },
  ACCEPTED: {
    label: 'Accepted',
    className: 'status-accepted',
    icon: '✅',
    desc: 'Great news! The alumnus accepted your referral request.',
  },
  REJECTED: {
    label: 'Not Selected',
    className: 'status-rejected',
    icon: '✕',
    desc: 'The alumnus was unable to refer you for this role.',
  },
};

export default function StudentReferralsPage() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    jobService
      .getStudentReferrals()
      .then((res) => {
        if (!isMounted) return;
        setReferrals(res?.data?.referrals || []);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load referral history.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

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
            <span>🤝</span> My Referral Requests
          </h1>
          <p className="referrals-subtitle">
            Track the status of your internal referral requests across top companies and connect directly with alumni mentors.
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
          <Link to="/jobs">
            <Button variant="primary" size="sm">
              🔍 Explore Jobs
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <ErrorAlert message={error} />
      )}

      <div className="referrals-tabs">
        <button
          className={`referral-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          All Requests <span className="tab-badge">{counts.ALL}</span>
        </button>
        <button
          className={`referral-tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
          onClick={() => setActiveTab('PENDING')}
        >
          Pending <span className="tab-badge">{counts.PENDING}</span>
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
          Not Selected <span className="tab-badge">{counts.REJECTED}</span>
        </button>
      </div>

      {loading ? (
        <Loading message="Loading your referral history..." fullScreen={false} />
      ) : filteredReferrals.length === 0 ? (
        <Card className="empty-state-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>📭</div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>
            {activeTab === 'ALL'
              ? 'No Referral Requests Yet'
              : `No ${activeTab.toLowerCase()} requests`}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', maxWidth: '460px', marginInline: 'auto' }}>
            {activeTab === 'ALL'
              ? 'Browse the alumni job board, find roles matching your skillset, and request internal referrals with a single click.'
              : `You currently do not have any requests marked as ${activeTab.toLowerCase()}.`}
          </p>
          <Link to="/jobs">
            <Button variant="primary">Browse Job Board</Button>
          </Link>
        </Card>
      ) : (
        <div className="referrals-grid">
          {filteredReferrals.map((referral) => {
            const job = referral.jobPost || {};
            const alumni = referral.alumni || {};
            const alumniProfile = alumni.profile || {};
            const statusMeta = STATUS_CONFIG[referral.status] || STATUS_CONFIG.PENDING;

            return (
              <div key={referral.id} className="referral-card">
                <div className="referral-card-top">
                  <div>
                    <h3 className="referral-subject-title">
                      {job.id ? (
                        <Link
                          to={`/jobs/${job.id}`}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {job.title || 'Opportunity'}
                        </Link>
                      ) : (
                        job.title || 'Opportunity'
                      )}
                    </h3>
                    <div className="referral-subject-sub">
                      <strong>🏢 {job.company || 'Unknown Company'}</strong>
                      {job.location && <span>• 📍 {job.location}</span>}
                      {job.employmentType && (
                        <span>• {job.employmentType.replace('_', ' ')}</span>
                      )}
                    </div>
                  </div>

                  <span className={`ref-status-badge ${statusMeta.className}`}>
                    <span>{statusMeta.icon}</span> {statusMeta.label}
                  </span>
                </div>

                {/* Alumni Contact Section */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    {alumni.name ? alumni.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      Referred to: <strong>{alumni.name || 'Alumnus'}</strong>
                    </div>
                    {(alumniProfile.designation || alumniProfile.company) && (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {[alumniProfile.designation, alumniProfile.company].filter(Boolean).join(' at ')}
                      </div>
                    )}
                  </div>
                  {alumniProfile.linkedinUrl && (
                    <a
                      href={alumniProfile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        marginLeft: 'auto',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-primary)',
                        textDecoration: 'none',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      🔗 LinkedIn
                    </a>
                  )}
                </div>

                {/* Submitted Message */}
                {referral.message ? (
                  <div className="referral-message-callout">
                    <span className="callout-label">Your Note to Alumnus:</span>
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
                    (No custom message was attached with this request)
                  </div>
                )}

                {/* Card Bottom: Metadata and Links */}
                <div className="referral-card-bottom">
                  <div className="referral-date-text">
                    Requested on {formatDate(referral.createdAt)} •{' '}
                    <span style={{ color: 'var(--color-text-muted)' }}>{statusMeta.desc}</span>
                  </div>

                  {job.id && (
                    <div className="referral-action-buttons">
                      <Link to={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          View Job Details →
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

