import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import {
  mockCurrentUser,
  mockStudentStats,
  mockMentors,
  mockJobs,
  mockActivities,
} from '../../services/mockData';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [mentors] = useState(mockMentors);
  const [jobs] = useState(mockJobs);
  const [requestedSlot, setRequestedSlot] = useState(null);

  const displayName = user?.name || mockCurrentUser.name;
  const displayBranch = user?.profile?.branch || mockCurrentUser.profile.branch;
  const displayGradYear = user?.profile?.graduationYear || mockCurrentUser.profile.graduationYear;
  const displayCollege = user?.profile?.college || mockCurrentUser.profile.college;

  const handleRequestMentorship = (mentorName) => {
    setRequestedSlot(`Mentorship request placeholder sent to ${mentorName}!`);
    setTimeout(() => setRequestedSlot(null), 4000);
  };

  return (
    <div className="dashboard-page student-dashboard">
      {/* Welcome Banner */}
      <div className="dashboard-welcome">
        <div className="welcome-text">
          <h1 className="dashboard-page-title">
            Welcome back, {displayName} 👋
          </h1>
          <p className="dashboard-page-subtitle">
            {displayBranch} • Class of {displayGradYear} • {displayCollege}
          </p>
        </div>
        <div className="welcome-actions">
          <Link to="/profile">
            <Button variant="secondary" size="sm">
              Edit Profile & Skills
            </Button>
          </Link>
        </div>
      </div>

      {requestedSlot && (
        <div className="dashboard-alert-banner">
          <span>✅ {requestedSlot}</span>
        </div>
      )}

      {/* Metric Stat Cards */}
      <section className="stats-grid">
        {mockStudentStats.map((stat) => (
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

      {/* Main Two-Column Layout */}
      <div className="dashboard-main-grid">
        {/* Left Column: Mentors & Jobs */}
        <div className="dashboard-main-col">
          {/* Recommended Alumni Mentors */}
          <section id="mentors">
            <Card
              title="Recommended Alumni Mentors"
              subtitle="Connect with graduates from your branch working across top industries"
              action={
                <span className="badge badge-primary">{mentors.length} Verified</span>
              }
            >
              <div className="mentors-list">
                {mentors.map((mentor) => (
                  <div key={mentor.id} className="mentor-item">
                    <div className="mentor-avatar">{mentor.avatar}</div>
                    <div className="mentor-details">
                      <div className="mentor-header">
                        <h4 className="mentor-name">{mentor.name}</h4>
                        <span className="mentor-rating">{mentor.rating}</span>
                      </div>
                      <p className="mentor-role">
                        {mentor.role} at <strong>{mentor.company}</strong>
                      </p>
                      <p className="mentor-topic">
                        <span className="topic-label">Focus Area:</span> {mentor.topic}
                      </p>
                      <div className="mentor-footer">
                        <span className="slot-badge">
                          {mentor.availableSlots} session(s) available this week
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequestMentorship(mentor.name)}
                        >
                          Book Session
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Job Openings with Referral Opportunities */}
          <section id="jobs" style={{ marginTop: 'var(--space-6)' }}>
            <Card
              title="Featured Job Referrals"
              subtitle="Direct referrals posted by alumni in your college network"
            >
              <div className="jobs-list">
                {jobs.map((job) => (
                  <div key={job.id} className="job-card-item">
                    <div className="job-info">
                      <div className="job-top">
                        <h4 className="job-title">{job.title}</h4>
                        <span className="job-type-pill">{job.employmentType}</span>
                      </div>
                      <p className="job-company">
                        {job.company} • <span>{job.location}</span>
                      </p>
                      <div className="job-tags">
                        {job.tags.map((tag) => (
                          <span key={tag} className="job-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="job-posted-by">
                        Posted by: <em>{job.postedBy}</em> • Deadline: {job.deadline}
                      </p>
                    </div>
                    <div className="job-actions">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRequestMentorship(job.postedBy)}
                      >
                        Request Referral
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>

        {/* Right Column: Activity Feed & Quick Resources */}
        <aside className="dashboard-side-col">
          <ActivityFeed
            title="Your Activity"
            items={mockActivities}
          />

          <Card title="Career Roadmap Tips" style={{ marginTop: 'var(--space-6)' }}>
            <div className="tips-list">
              <div className="tip-item">
                <span className="tip-bullet">1.</span>
                <p>Complete your profile details and skill tags to receive personalized mentor recommendations.</p>
              </div>
              <div className="tip-item">
                <span className="tip-bullet">2.</span>
                <p>Prepare targeted questions before scheduling a 1-on-1 alumni mentorship session.</p>
              </div>
              <div className="tip-item">
                <span className="tip-bullet">3.</span>
                <p>Keep your GitHub and LinkedIn URLs up-to-date for alumni referral applications.</p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
