import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import {
  mockAlumniUser,
  mockAlumniStats,
  mockMentorshipRequests,
  mockJobs,
  mockActivities,
} from '../../services/mockData';
import './AlumniDashboard.css';

export default function AlumniDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState(mockMentorshipRequests);
  const [actionNotice, setActionNotice] = useState(null);

  const displayName = user?.name || mockAlumniUser.name;
  const displayDesignation = user?.profile?.designation || mockAlumniUser.profile.designation;
  const displayCompany = user?.profile?.company || mockAlumniUser.profile.company;
  const displayGradYear = user?.profile?.graduationYear || mockAlumniUser.profile.graduationYear;

  const handleUpdateStatus = (id, newStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    setActionNotice(`Mentorship request #${id} marked as ${newStatus}!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="dashboard-page alumni-dashboard">
      {/* Welcome Banner */}
      <div className="dashboard-welcome">
        <div className="welcome-text">
          <h1 className="dashboard-page-title">
            Welcome back, {displayName} 🎓
          </h1>
          <p className="dashboard-page-subtitle">
            {displayDesignation} at <strong>{displayCompany}</strong> • Class of {displayGradYear}
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

      {actionNotice && (
        <div className="dashboard-alert-banner">
          <span>✅ {actionNotice}</span>
        </div>
      )}

      {/* Metric Stat Cards */}
      <section className="stats-grid">
        {mockAlumniStats.map((stat) => (
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

      {/* Two Column Layout */}
      <div className="dashboard-main-grid">
        <div className="dashboard-main-col">
          {/* Incoming Mentorship Requests */}
          <section id="requests">
            <Card
              title="Incoming Student Mentorship Requests"
              subtitle="Review and accept 1-on-1 guidance sessions requested by students"
              action={
                <span className="badge badge-primary">
                  {requests.filter((r) => r.status === 'PENDING').length} Pending
                </span>
              }
            >
              <div className="requests-list">
                {requests.map((req) => (
                  <div key={req.id} className="request-card">
                    <div className="request-header">
                      <div>
                        <h4 className="student-name">{req.studentName}</h4>
                        <span className="student-branch">{req.branch}</span>
                      </div>
                      <span className={`status-pill status-${req.status.toLowerCase()}`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="request-body">
                      <p className="request-topic">
                        <strong>Topic:</strong> {req.topic}
                      </p>
                      <p className="request-time">
                        <strong>Requested Schedule:</strong> {req.requestedTime}
                      </p>
                      <p className="request-message">
                        &quot;{req.message}&quot;
                      </p>
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="request-actions">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateStatus(req.id, 'ACCEPTED')}
                        >
                          Accept Session
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(req.id, 'DECLINED')}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Active Job & Referral Postings */}
          <section id="postings" style={{ marginTop: 'var(--space-6)' }}>
            <Card
              title="Your Job Referral Listings"
              subtitle="Roles you've shared with verified collegiate members"
              action={
                <Button variant="primary" size="sm">
                  + Post New Role
                </Button>
              }
            >
              <div className="alumni-jobs-list">
                {mockJobs.slice(0, 2).map((job) => (
                  <div key={job.id} className="alumni-job-row">
                    <div>
                      <h4 className="job-row-title">{job.title}</h4>
                      <p className="job-row-meta">
                        {job.company} • {job.location} • Closes {job.deadline}
                      </p>
                    </div>
                    <span className="badge badge-success">Active & Receiving Applicants</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>

        {/* Right Column: Office Hours & Activity */}
        <aside className="dashboard-side-col">
          <Card
            title="Mentorship Office Hours"
            subtitle="Configured slots for this week"
            action={
              <Button variant="outline" size="sm">
                Edit Slots
              </Button>
            }
          >
            <div className="office-hours-list">
              <div className="slot-item">
                <span className="slot-day">Wednesdays</span>
                <span className="slot-time">6:00 PM – 7:30 PM IST</span>
                <span className="slot-state booked">Booked</span>
              </div>
              <div className="slot-item">
                <span className="slot-day">Fridays</span>
                <span className="slot-time">5:00 PM – 6:30 PM IST</span>
                <span className="slot-state available">Available</span>
              </div>
              <div className="slot-item">
                <span className="slot-day">Saturdays</span>
                <span className="slot-time">11:00 AM – 12:30 PM IST</span>
                <span className="slot-state available">Available</span>
              </div>
            </div>
          </Card>

          <div style={{ marginTop: 'var(--space-6)' }}>
            <ActivityFeed
              title="Recent Alumni Interactions"
              items={mockActivities}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
