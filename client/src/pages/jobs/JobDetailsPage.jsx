import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import jobService from '../../services/jobService';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Textarea from '../../components/common/Textarea';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import './Jobs.css';

export default function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Referral Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [referralMessage, setReferralMessage] = useState('');
  const [submittingReferral, setSubmittingReferral] = useState(false);
  const [referralSuccess, setReferralSuccess] = useState(false);
  const [referralError, setReferralError] = useState(null);
  const [hasRequested, setHasRequested] = useState(false);
  const [existingReferralStatus, setExistingReferralStatus] = useState(null);

  // Delete confirmation
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    let isMounted = true;
    jobService
      .getJobById(id)
      .then((res) => {
        if (!isMounted) return;
        if (res?.data?.job) {
          setJob(res.data.job);
        } else {
          setError('Opportunity could not be found.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load opportunity details.');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    // Check if student already submitted a referral request for this job
    if (user?.role === 'STUDENT') {
      jobService
        .getStudentReferrals()
        .then((res) => {
          if (!isMounted) return;
          if (res?.success && Array.isArray(res?.data?.referrals)) {
            const found = res.data.referrals.find(
              (r) => Number(r.jobPostId) === Number(id) || Number(r.jobPost?.id) === Number(id)
            );
            if (found) {
              setHasRequested(true);
              setExistingReferralStatus(found.status);
            }
          }
        })
        .catch(() => {
          // Ignore non-blocking referral status fetch error
        });
    }

    return () => {
      isMounted = false;
    };
  }, [id, user?.role]);

  // Handle referral submission
  const handleSubmitReferral = async (e) => {
    e.preventDefault();
    setSubmittingReferral(true);
    setReferralError(null);
    try {
      await jobService.requestReferral(id, {
        message: referralMessage.trim() || undefined,
      });
      setReferralSuccess(true);
      setHasRequested(true);
      setExistingReferralStatus('PENDING');
      setTimeout(() => {
        setIsModalOpen(false);
        setReferralSuccess(false);
        setReferralMessage('');
      }, 2000);
    } catch (err) {
      setReferralError(err.message || 'Failed to submit referral request.');
    } finally {
      setSubmittingReferral(false);
    }
  };

  // Handle job deletion
  const handleDeleteJob = async () => {
    setDeleting(true);
    try {
      await jobService.deleteJob(id);
      navigate('/jobs', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to delete job post.');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loading text="Loading opportunity details..." fullScreen={false} />;
  }

  if (error || !job) {
    return (
      <div className="container" style={{ padding: 'var(--space-8) 0' }}>
        <ErrorAlert message={error || 'Job not found.'} />
        <Link to="/jobs">
          <Button variant="outline">← Back to Job Board</Button>
        </Link>
      </div>
    );
  }

  const isOwner = user && (user.id === job.postedById || user.userId === job.postedById);
  const isAdmin = user?.role === 'ADMIN';
  const canManage = isOwner || isAdmin;
  const isStudent = user?.role === 'STUDENT';

  const poster = job.postedBy || {};
  const posterProfile = poster.profile || {};
  const posterInitial = poster.name ? poster.name.charAt(0).toUpperCase() : 'A';

  const employmentTypeLabel = job.employmentType
    ? job.employmentType.replace('_', ' ')
    : 'Full Time';

  return (
    <div className="jobs-page container">
      {/* Top Breadcrumb & Actions Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-6)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <Link to="/jobs" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="sm">
            ← Back to Job Board
          </Button>
        </Link>

        {canManage && (
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Link to={`/jobs/${job.id}/edit`}>
              <Button variant="outline" size="sm">
                ✏️ Edit Posting
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              🗑️ Delete
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Banner */}
      {showDeleteConfirm && (
        <div
          style={{
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <div>
            <strong>Are you sure you want to delete this job posting?</strong>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              This action cannot be undone. All incoming referral requests for this job will also be removed.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleting}
              onClick={handleDeleteJob}
            >
              Yes, Delete Posting
            </Button>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="job-details-shell">
        {/* Left Column: Job Description and Overview */}
        <div className="job-details-main">
          <Card className="job-details-hero">
            <div className="job-badges-strip">
              <span className="job-badge badge-full-time">
                {employmentTypeLabel}
              </span>
              {job.experienceLevel && (
                <span className="job-badge badge-exp">
                  {job.experienceLevel} Level
                </span>
              )}
              {job.location && (
                <span className="job-badge badge-contract">
                  📍 {job.location}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 'var(--font-size-3xl)', color: 'var(--color-text-main)', marginBottom: 'var(--space-2)' }}>
              {job.title}
            </h1>
            <div style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-4)' }}>
              🏢 {job.company}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-4)',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                marginTop: 'var(--space-4)',
              }}
            >
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', display: 'block' }}>
                  LOCATION
                </span>
                <strong>{job.location || 'Not Specified'}</strong>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', display: 'block' }}>
                  EMPLOYMENT TYPE
                </span>
                <strong>{employmentTypeLabel}</strong>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', display: 'block' }}>
                  EXPERIENCE REQUIRED
                </span>
                <strong>{job.experienceLevel || 'All Levels'}</strong>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', display: 'block' }}>
                  APPLICATION DEADLINE
                </span>
                <strong>
                  {job.deadline
                    ? new Date(job.deadline).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Open until filled'}
                </strong>
              </div>
            </div>
          </Card>

          <Card title="Opportunity Description" subtitle="Role requirements, scope, and technical context">
            <div className="job-description-content">
              {job.description}
            </div>
          </Card>

          {job.applicationUrl && (
            <Card title="External Application Portal">
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                You can apply directly to the employer or company careers portal via the link below:
              </p>
              <a
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <Button variant="outline" size="md">
                  Visit Company Careers Page ↗
                </Button>
              </a>
            </Card>
          )}
        </div>

        {/* Right Column: Alumni Poster & Action Sidebar */}
        <div className="job-sidebar-card">
          <Card className="poster-card" title="Alumni Referral Sponsor">
            <div className="poster-card-body">
              <div className="poster-profile-header">
                <div className="poster-avatar">{posterInitial}</div>
                <div>
                  <div className="poster-name">{poster.name || 'Alumni Member'}</div>
                  <div className="poster-title">
                    {posterProfile.designation
                      ? `${posterProfile.designation} at ${posterProfile.company || job.company}`
                      : posterProfile.company || 'Alumni Professional'}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                  color: 'var(--color-text-muted)',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 'var(--space-3)',
                }}
              >
                {posterProfile.branch && (
                  <div>
                    <strong>Alma Mater Branch:</strong> {posterProfile.branch}
                  </div>
                )}
                {posterProfile.college && (
                  <div>
                    <strong>College:</strong> {posterProfile.college}
                  </div>
                )}
                {posterProfile.graduationYear && (
                  <div>
                    <strong>Class of:</strong> {posterProfile.graduationYear}
                  </div>
                )}
                {posterProfile.linkedinUrl && (
                  <div>
                    <a
                      href={posterProfile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-accent)', textDecoration: 'none' }}
                    >
                      View LinkedIn Profile ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Student Action: Request Referral or View Existing Status */}
              {isStudent && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  {hasRequested ? (
                    <div
                      style={{
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--color-bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          textTransform: 'uppercase',
                          fontWeight: 'bold',
                          color: 'var(--color-primary)',
                          marginBottom: 'var(--space-2)',
                        }}
                      >
                        Referral Request Submitted
                      </div>
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          backgroundColor:
                            existingReferralStatus === 'ACCEPTED'
                              ? '#dcfce7'
                              : existingReferralStatus === 'REJECTED'
                              ? '#f1f5f9'
                              : existingReferralStatus === 'REVIEWED'
                              ? '#e0f2fe'
                              : '#fef3c7',
                          color:
                            existingReferralStatus === 'ACCEPTED'
                              ? '#166534'
                              : existingReferralStatus === 'REJECTED'
                              ? '#475569'
                              : existingReferralStatus === 'REVIEWED'
                              ? '#0369a1'
                              : '#92400e',
                          marginBottom: 'var(--space-3)',
                        }}
                      >
                        Status: {existingReferralStatus || 'PENDING'}
                      </div>
                      <div>
                        <Link to="/referrals/my" style={{ textDecoration: 'none' }}>
                          <Button variant="outline" size="sm" block>
                            Track In My Referrals →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        block
                        size="lg"
                        onClick={() => setIsModalOpen(true)}
                      >
                        🤝 Request Internal Referral
                      </Button>
                      <p
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-subtle)',
                          textAlign: 'center',
                          marginTop: 'var(--space-2)',
                        }}
                      >
                        Directly message {poster.name || 'the alumnus'} for an employee referral.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Alumni management shortcut */}
              {canManage && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <Link to="/jobs/my" style={{ textDecoration: 'none' }}>
                    <Button variant="secondary" block size="md">
                      📋 Manage My Job Postings
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Referral Request Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Request Job Referral</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitReferral}>
              <div className="modal-body">
                {referralSuccess ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 'var(--space-6)',
                      color: 'var(--color-success)',
                    }}
                  >
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--space-2)' }}>
                      🎉
                    </span>
                    <h4>Referral Request Sent!</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                      {poster.name || 'The alumnus'} has been notified. You can track this application in your dashboard.
                    </p>
                  </div>
                ) : (
                  <>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
                      You are requesting an internal referral for <strong>{job.title}</strong> at <strong>{job.company}</strong> from <strong>{poster.name || 'Alumnus'}</strong>.
                    </p>

                    {referralError && (
                      <ErrorAlert message={referralError} onDismiss={() => setReferralError(null)} />
                    )}

                    <Textarea
                      label="Introduction & Why You're a Great Fit"
                      placeholder="Briefly highlight your relevant skills, projects, and why you are interested in this position..."
                      value={referralMessage}
                      onChange={(e) => setReferralMessage(e.target.value)}
                      rows={5}
                      helpText="Tip: Mention specific programming languages or frameworks that match the job description."
                    />
                  </>
                )}
              </div>

              {!referralSuccess && (
                <div className="modal-footer">
                  <Button
                    variant="ghost"
                    size="md"
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    isLoading={submittingReferral}
                  >
                    Submit Referral Request
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
