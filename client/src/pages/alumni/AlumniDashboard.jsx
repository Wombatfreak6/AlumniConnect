import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import useAuth from '../../hooks/useAuth';
import userService from '../../services/userService';
import './AlumniDashboard.css';

export default function AlumniDashboard() {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    userService
      .getMyProfile()
      .then((res) => {
        if (isMounted && res.data?.user) {
          setProfileData(res.data.user);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch alumni profile:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <Loading message="Loading alumni portal..." fullScreen={false} />;
  }

  const currentUser = profileData || authUser;
  const profile = currentUser?.profile || {};
  const skills = currentUser?.skills || [];

  return (
    <div className="dashboard-page alumni-dashboard">
      <div className="dashboard-welcome">
        <div className="welcome-text">
          <div className="welcome-badge-strip">
            <span className="badge badge-alumni">ALUMNI PORTAL</span>
            <span className="welcome-verified">Verified Graduate</span>
          </div>
          <h1 className="dashboard-page-title">
            Welcome, {currentUser?.name || 'Alumni Member'} 🎓
          </h1>
          <p className="dashboard-page-subtitle">
            {profile.designation && profile.company
              ? `${profile.designation} at ${profile.company}`
              : profile.company || 'Professional Profile'}
            {profile.graduationYear ? ` • Class of ${profile.graduationYear}` : ''}
            {profile.college ? ` • ${profile.college}` : ''}
          </p>
        </div>
        <div className="welcome-actions">
          <Link to="/profile">
            <Button variant="secondary" size="sm">
              Update Professional Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="alumni-overview-grid">
        <Card
          title="Company & Industry Profile"
          subtitle="Your verified employer and industry sector"
          action={
            <Link to="/profile" className="card-link-action">
              Edit
            </Link>
          }
        >
          <div className="alumni-details-list">
            <div className="alumni-detail-row">
              <span className="detail-key">Current Organization:</span>
              <span className="detail-value">{profile.company || 'Not specified'}</span>
            </div>
            <div className="alumni-detail-row">
              <span className="detail-key">Designation / Role:</span>
              <span className="detail-value">{profile.designation || 'Not specified'}</span>
            </div>
            <div className="alumni-detail-row">
              <span className="detail-key">Industry Sector:</span>
              <span className="detail-value">{profile.industry || 'Not specified'}</span>
            </div>
            <div className="alumni-detail-row">
              <span className="detail-key">LinkedIn:</span>
              <span className="detail-value">
                {profile.linkedinUrl ? (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="linkedin-link"
                  >
                    View Profile ↗
                  </a>
                ) : (
                  'Not specified'
                )}
              </span>
            </div>
          </div>
        </Card>

        <Card
          title="Collegiate Background"
          subtitle="Your graduation and department records"
          action={
            <Link to="/profile" className="card-link-action">
              Edit
            </Link>
          }
        >
          <div className="alumni-details-list">
            <div className="alumni-detail-row">
              <span className="detail-key">Alma Mater:</span>
              <span className="detail-value">{profile.college || 'Not specified'}</span>
            </div>
            <div className="alumni-detail-row">
              <span className="detail-key">Department / Branch:</span>
              <span className="detail-value">{profile.branch || 'Not specified'}</span>
            </div>
            <div className="alumni-detail-row">
              <span className="detail-key">Batch Period:</span>
              <span className="detail-value">{profile.batch || 'Not specified'}</span>
            </div>
            <div className="alumni-detail-row">
              <span className="detail-key">Graduation Year:</span>
              <span className="detail-value">{profile.graduationYear || 'Not specified'}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="alumni-expertise-grid">
        <Card
          title="Skills & Technical Domains"
          subtitle="Skills linked to your alumni profile"
          action={
            <Link to="/profile" className="card-link-action">
              + Manage Skills
            </Link>
          }
        >
          {skills.length === 0 ? (
            <div className="empty-overview-box">
              <p>No skills linked yet.</p>
              <Link to="/profile">
                <Button size="sm" variant="outline">
                  Add Your Skills
                </Button>
              </Link>
            </div>
          ) : (
            <div className="skills-tag-cloud">
              {skills.map((skill) => (
                <span key={skill.id} className="skill-pill">
                  {skill.name}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Mentorship Focus & Guidance Areas"
          subtitle="Topics you can guide students on"
          action={
            <Link to="/profile" className="card-link-action">
              Edit
            </Link>
          }
        >
          {profile.careerGoals ? (
            <p className="career-goals-display">{profile.careerGoals}</p>
          ) : (
            <div className="empty-overview-box">
              <p>No mentorship focus areas outlined yet.</p>
              <Link to="/profile">
                <Button size="sm" variant="outline">
                  Specify Mentoring Topics
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      <div className="modules-header">
        <h2 className="modules-title">Alumni Engagement Modules</h2>
        <p className="modules-subtitle">
          Share your experience and create opportunities for students.
        </p>
      </div>

      <div className="modules-grid">
        <Card className="module-card">
          <div className="module-top">
            <span className="module-icon" aria-hidden="true">💼</span>
            <span className="module-status-badge badge-active" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success)' }}>
              Active • Live Now
            </span>
          </div>
          <h3 className="module-name">Job & Referral Management</h3>
          <p className="module-desc">
            Post hiring openings from your organization, manage your active listings, and review student referral inquiries.
          </p>
          <div className="module-footer" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Link to="/jobs/create">
              <Button size="sm" variant="primary">
                + Post Job
              </Button>
            </Link>
            <Link to="/jobs/my">
              <Button size="sm" variant="outline">
                My Postings
              </Button>
            </Link>
            <Link to="/referrals/received">
              <Button size="sm" variant="outline">
                Referral Requests
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="module-card">
          <div className="module-top">
            <span className="module-icon" aria-hidden="true">🎓</span>
            <span className="module-status-badge badge-active">Available now</span>
          </div>
          <h3 className="module-name">Mentorship & Office Hours</h3>
          <p className="module-desc">
            Publish upcoming office hours, update your availability, and respond to student requests.
          </p>
          <div className="module-footer">
            <Link to="/mentorship/manage">
              <Button size="sm" variant="primary">Manage mentorship</Button>
            </Link>
          </div>
        </Card>

        <Card className="module-card">
          <div className="module-top">
            <span className="module-icon" aria-hidden="true">📅</span>
            <span className="module-status-badge badge-active">Available now</span>
          </div>
          <h3 className="module-name">Campus Events & Tech Talks</h3>
          <p className="module-desc">
            Host workshops and networking events, then review participant registrations.
          </p>
          <div className="module-footer" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Link to="/events">
              <Button size="sm" variant="outline">Browse events</Button>
            </Link>
            <Link to="/events/create">
              <Button size="sm" variant="primary">Create event</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
