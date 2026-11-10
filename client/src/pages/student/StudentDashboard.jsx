import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import useAuth from '../../hooks/useAuth';
import userService from '../../services/userService';
import './StudentDashboard.css';

export default function StudentDashboard() {
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
        console.warn('Could not fetch student profile:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <Loading text="Loading student hub..." fullScreen={false} />;
  }

  const currentUser = profileData || authUser;
  const profile = currentUser?.profile || {};
  const skills = currentUser?.skills || [];

  // Calculate Profile Completion Percentage
  const completionCriteria = [
    Boolean(currentUser?.name),
    Boolean(profile.college),
    Boolean(profile.branch),
    Boolean(profile.graduationYear || profile.batch),
    Boolean(profile.bio),
    Boolean(profile.careerGoals),
    Boolean(skills.length > 0),
    Boolean(profile.linkedinUrl),
  ];
  const completedCount = completionCriteria.filter(Boolean).length;
  const completionPercentage = Math.round((completedCount / completionCriteria.length) * 100);

  return (
    <div className="dashboard-page student-dashboard">
      {/* 1. Welcome Section */}
      <div className="dashboard-welcome">
        <div className="welcome-text">
          <div className="welcome-badge-strip">
            <span className="badge badge-student">STUDENT PORTAL</span>
            <span className="welcome-verified">Verified Account</span>
          </div>
          <h1 className="dashboard-page-title">
            Welcome, {currentUser?.name || 'Student'} 👋
          </h1>
          <p className="dashboard-page-subtitle">
            {profile.branch ? `${profile.branch}` : 'Department Not Specified'}
            {profile.graduationYear ? ` • Class of ${profile.graduationYear}` : ''}
            {profile.college ? ` • ${profile.college}` : ' • Update your college in Profile'}
          </p>
        </div>
        <div className="welcome-actions">
          <Link to="/profile">
            <Button variant="secondary" size="sm">
              Update Profile & Skills
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Profile Completion Indicator */}
      <Card className="completion-card">
        <div className="completion-header">
          <div>
            <h3 className="completion-title">Profile Completion: {completionPercentage}%</h3>
            <p className="completion-subtitle">
              {completionPercentage === 100
                ? 'Your student profile is comprehensive and ready for alumni matching!'
                : 'A complete profile improves mentorship recommendations and alumni referral rates.'}
            </p>
          </div>
          <Link to="/profile">
            <Button variant="outline" size="sm">
              {completionPercentage === 100 ? 'View Details' : 'Complete Profile'}
            </Button>
          </Link>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${completionPercentage}%` }}
            role="progressbar"
            aria-valuenow={completionPercentage}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
        <div className="completion-checklist">
          <span className={`check-item ${profile.college ? 'done' : 'pending'}`}>
            {profile.college ? '✔ College' : '○ College'}
          </span>
          <span className={`check-item ${profile.branch ? 'done' : 'pending'}`}>
            {profile.branch ? '✔ Branch' : '○ Branch'}
          </span>
          <span className={`check-item ${skills.length > 0 ? 'done' : 'pending'}`}>
            {skills.length > 0 ? `✔ Skills (${skills.length})` : '○ Skills'}
          </span>
          <span className={`check-item ${profile.careerGoals ? 'done' : 'pending'}`}>
            {profile.careerGoals ? '✔ Career Goals' : '○ Career Goals'}
          </span>
          <span className={`check-item ${profile.bio ? 'done' : 'pending'}`}>
            {profile.bio ? '✔ Bio' : '○ Bio'}
          </span>
        </div>
      </Card>

      {/* 3. Grid: Live Skills & Career Interests */}
      <div className="student-profile-overview-grid">
        {/* Skills Overview */}
        <Card
          title="Skills & Technical Competencies"
          subtitle="Skills listed on your live collegiate profile"
          action={
            <Link to="/profile" className="card-link-action">
              + Manage Skills
            </Link>
          }
        >
          {skills.length === 0 ? (
            <div className="empty-overview-box">
              <p>No skills added yet.</p>
              <Link to="/profile">
                <Button size="sm" variant="outline">
                  Add Your Technical Skills
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

        {/* Career Interests Overview */}
        <Card
          title="Career Interests & Direction"
          subtitle="Your professional focus and aspirations"
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
              <p>You haven&apos;t specified your career goals yet.</p>
              <Link to="/profile">
                <Button size="sm" variant="outline">
                  Define Career Aspirations
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* 4. Future Modules Navigation & Placeholders */}
      <div className="modules-header">
        <h2 className="modules-title">Platform Capabilities & Roadmapped Modules</h2>
        <p className="modules-subtitle">
          Modules under active development by your AlumniConnect engineering team
        </p>
      </div>

      <div className="modules-grid">
        {/* Navigation to Jobs Live Card */}
        <Card className="module-card">
          <div className="module-top">
            <span className="module-icon" aria-hidden="true">💼</span>
            <span className="module-status-badge badge-active" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success)' }}>
              Active • Live Now
            </span>
          </div>
          <h3 className="module-name">Job & Internship Referrals</h3>
          <p className="module-desc">
            Direct referral pipeline to request internal company applications from alumni. Browse active openings and receive personalized matching recommendations.
          </p>
          <div className="module-footer" style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Link to="/jobs">
              <Button size="sm" variant="primary">
                Browse Jobs →
              </Button>
            </Link>
            <Link to="/referrals/my">
              <Button size="sm" variant="outline">
                My Referrals
              </Button>
            </Link>
          </div>
        </Card>

        {/* Navigation to Mentorship Placeholder */}
        <Card className="module-card">
          <div className="module-top">
            <span className="module-icon" aria-hidden="true">🤝</span>
            <span className="module-status-badge badge-phase">Phase 3 • Member 3</span>
          </div>
          <h3 className="module-name">1-on-1 Alumni Mentorship</h3>
          <p className="module-desc">
            Structured advisory sessions and smart alumni matching. Member 3 is building the
            MentorshipSlot calendar availability and booking request management engine.
          </p>
          <div className="module-footer">
            <span className="placeholder-tag">Placeholder — Coming in Phase 3</span>
          </div>
        </Card>

        {/* Navigation to Networking Placeholder */}
        <Card className="module-card">
          <div className="module-top">
            <span className="module-icon" aria-hidden="true">👥</span>
            <span className="module-status-badge badge-future">Upcoming</span>
          </div>
          <h3 className="module-name">Alumni Network Directory</h3>
          <p className="module-desc">
            Branch and batch-wise alumni directory discovery to connect with graduated seniors across
            global technology and research firms.
          </p>
          <div className="module-footer">
            <span className="placeholder-tag">Placeholder — Network Discovery</span>
          </div>
        </Card>

        {/* Navigation to Events Placeholder */}
        <Card className="module-card">
          <div className="module-top">
            <span className="module-icon" aria-hidden="true">📅</span>
            <span className="module-status-badge badge-future">Upcoming</span>
          </div>
          <h3 className="module-name">Campus Events & Webinars</h3>
          <p className="module-desc">
            Collegiate tech talks, virtual webinars, alumni roundtables, and career workshops
            managed collaboratively with college administration.
          </p>
          <div className="module-footer">
            <span className="placeholder-tag">Placeholder — Events Engine</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
