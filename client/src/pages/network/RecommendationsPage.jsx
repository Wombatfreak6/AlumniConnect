import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobService from '../../services/jobService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import './Recommendations.css';

function getScoreClasses(score) {
  if (score >= 70) {
    return { badgeClass: 'score-high', fillClass: 'fill-high', label: 'High Alignment' };
  }
  if (score >= 40) {
    return { badgeClass: 'score-mid', fillClass: 'fill-mid', label: 'Moderate Match' };
  }
  return { badgeClass: 'score-low', fillClass: 'fill-low', label: 'Collegiate Match' };
}

export default function RecommendationsPage() {
  const [alumniMatches, setAlumniMatches] = useState([]);
  const [jobMatches, setJobMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('alumni');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      jobService.getRecommendedAlumni(),
      jobService.getRecommendedJobs(),
    ])
      .then(([alumniRes, jobsRes]) => {
        if (!isMounted) return;
        const alumniData = Array.isArray(alumniRes?.data)
          ? alumniRes.data
          : alumniRes?.data?.matches || [];
        const jobsData = Array.isArray(jobsRes?.data)
          ? jobsRes.data
          : jobsRes?.data?.recommendations || [];

        setAlumniMatches(alumniData);
        setJobMatches(jobsData);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to fetch intelligent recommendations.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  return (
    <div className="recommendations-page container">
      {/* Page Header */}
      <div className="rec-header">
        <div>
          <h1 className="rec-title">
            <span>⚡</span> Intelligent Recommendations
          </h1>
          <p className="rec-subtitle">
            AlumniConnect analyzes your verified technical skills, academic branch, and career goals to compute real-time compatibility scores for alumni mentors and job opportunities.
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
            🔄 Recalculate Matches
          </Button>
          <Link to="/profile">
            <Button variant="primary" size="sm">
              ⚙️ Tune Profile & Skills
            </Button>
          </Link>
        </div>
      </div>

      {/* Tip Banner */}
      <div className="profile-tip-banner">
        <div className="profile-tip-text">
          <strong>💡 How matching works:</strong> Scores are calculated across <strong>Skill Overlap (50%)</strong>, <strong>Academic Department Alignment (30%)</strong>, and <strong>Career & Industry Goals (20%)</strong>. Keeping your profile updated maximizes your top matches!
        </div>
        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="sm">
            Update Profile →
          </Button>
        </Link>
      </div>

      {error && (
        <ErrorAlert message={error} />
      )}

      {/* Navigation Tabs */}
      <div className="rec-tabs">
        <button
          className={`rec-tab-btn ${activeTab === 'alumni' ? 'active' : ''}`}
          onClick={() => setActiveTab('alumni')}
        >
          <span>👥 Recommended Alumni</span>
          <span className="rec-tab-badge">{alumniMatches.length}</span>
        </button>
        <button
          className={`rec-tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <span>💼 Recommended Jobs</span>
          <span className="rec-tab-badge">{jobMatches.length}</span>
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <Loading message="Analyzing your profile and calculating intelligent matches..." fullScreen={false} />
      ) : activeTab === 'alumni' ? (
        alumniMatches.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>🎓</div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>No Alumni Matches Found</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', maxWidth: '480px', marginInline: 'auto' }}>
              We could not find matching alumni yet. Enhance your profile by adding your academic branch, graduation year, and technical skills to discover mentors.
            </p>
            <Link to="/profile">
              <Button variant="primary">Add Skills & Branch to Profile</Button>
            </Link>
          </Card>
        ) : (
          <div className="rec-grid">
            {alumniMatches.map((alumnus) => {
              const score = alumnus.matchScore ?? 0;
              const { badgeClass, fillClass, label } = getScoreClasses(score);
              const matchedSkills = alumnus.matchedSkills || [];
              const allSkills = alumnus.skills || matchedSkills;
              const matchedLower = new Set(matchedSkills.map((skill) => skill.toLowerCase()));
              const unmatchedSkills = allSkills.filter(
                (skill) => !matchedLower.has(skill.toLowerCase())
              );
              const breakdown = alumnus.breakdown || {};

              return (
                <div key={alumnus.alumniId} className="rec-card">
                  {/* Top Bar: Name & Score Indicator */}
                  <div className="rec-card-header">
                    <div>
                      <h3 className="rec-card-title">{alumnus.name}</h3>
                      <div className="rec-card-sub">
                        {alumnus.designation
                          ? `${alumnus.designation}${alumnus.company ? ` at ${alumnus.company}` : ''}`
                          : alumnus.company || 'Alumni Member'}
                      </div>
                      <div className="rec-card-meta-line">
                        {alumnus.branch && <span>📚 {alumnus.branch}</span>}
                        {alumnus.college && <span>🎓 {alumnus.college}</span>}
                        {alumnus.graduationYear && <span>🗓️ Class of {alumnus.graduationYear}</span>}
                      </div>
                    </div>

                    <span className={`match-score-badge ${badgeClass}`}>
                      ⚡ {score}/100 Match
                    </span>
                  </div>

                  {/* Visual Progress Bar & Score Breakdown */}
                  <div className="score-progress-box">
                    <div className="score-progress-header">
                      <span>Match Compatibility</span>
                      <span>{score}% ({label})</span>
                    </div>
                    <div className="score-progress-track">
                      <div
                        className={`score-progress-fill ${fillClass}`}
                        style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                      />
                    </div>
                    {(breakdown.skillScore !== undefined || breakdown.branchScore !== undefined) && (
                      <div className="score-breakdown-row">
                        {breakdown.skillScore !== undefined && (
                          <span className="score-breakdown-chip">
                            Skills: +{breakdown.skillScore} pts
                          </span>
                        )}
                        {breakdown.branchScore !== undefined && (
                          <span className="score-breakdown-chip">
                            Branch: +{breakdown.branchScore} pts
                          </span>
                        )}
                        {breakdown.industryScore !== undefined && (
                          <span className="score-breakdown-chip">
                            Industry: +{breakdown.industryScore} pts
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recommendation Reason Callout */}
                  {alumnus.reason && (
                    <div className="rec-reason-callout">
                      <div className="reason-label">
                        <span>🎯</span> Why Recommended
                      </div>
                      <div>{alumnus.reason}</div>
                    </div>
                  )}

                  {/* Matched Skills */}
                  <div className="rec-skills-section">
                    <div className="rec-section-heading">
                      Matched Skills ({matchedSkills.length}):
                    </div>
                    {matchedSkills.length > 0 ? (
                      <div className="skills-cluster">
                        {matchedSkills.map((skill) => (
                          <span key={skill} className="skill-pill-matched">
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        No direct skill overlaps detected yet.
                      </span>
                    )}
                  </div>

                  {/* Additional Alumni Skills */}
                  {unmatchedSkills.length > 0 && (
                    <div className="rec-skills-section">
                      <div className="rec-section-heading">Other Skills:</div>
                      <div className="skills-cluster">
                        {unmatchedSkills.slice(0, 6).map((skill) => (
                          <span key={skill} className="skill-pill-other">
                            {skill}
                          </span>
                        ))}
                        {unmatchedSkills.length > 6 && (
                          <span className="skill-pill-other">
                            +{unmatchedSkills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Profile Bio if available */}
                  {alumnus.bio && (
                    <div className="rec-profile-details">
                      <strong>Bio:</strong> {alumnus.bio}
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="rec-card-footer">
                    {alumnus.linkedinUrl ? (
                      <a
                        href={alumnus.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-primary)',
                          textDecoration: 'none',
                          fontWeight: 'var(--font-weight-medium)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        🔗 LinkedIn Profile ↗
                      </a>
                    ) : (
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        Contact via AlumniConnect
                      </span>
                    )}

                    <Link to="/jobs">
                      <Button variant="outline" size="sm">
                        View Open Jobs →
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        jobMatches.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>💼</div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>No Job Matches Found</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', maxWidth: '480px', marginInline: 'auto' }}>
              We could not compute job recommendations for your current profile. Update your technical skills in your profile to discover personalized opportunities.
            </p>
            <Link to="/profile">
              <Button variant="primary">Add Skills to Profile</Button>
            </Link>
          </Card>
        ) : (
          <div className="rec-grid">
            {jobMatches.map((job) => {
              const score = job.matchScore ?? 0;
              const { badgeClass, fillClass, label } = getScoreClasses(score);
              const matchedSkills = job.matchedSkills || [];
              const breakdown = job.breakdown || {};
              const poster = job.postedBy || {};

              return (
                <div key={job.jobId} className="rec-card">
                  {/* Top Bar: Job Title & Match Score */}
                  <div className="rec-card-header">
                    <div>
                      <h3 className="rec-card-title">
                        <Link
                          to={`/jobs/${job.jobId}`}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {job.title}
                        </Link>
                      </h3>
                      <div className="rec-card-sub">
                        🏢 {job.company}
                      </div>
                      <div className="rec-card-meta-line">
                        {job.location && <span>📍 {job.location}</span>}
                        {job.employmentType && (
                          <span>• {job.employmentType.replace('_', ' ')}</span>
                        )}
                        {job.experienceLevel && (
                          <span>• {job.experienceLevel} Level</span>
                        )}
                      </div>
                    </div>

                    <span className={`match-score-badge ${badgeClass}`}>
                      ⚡ {score}% Match
                    </span>
                  </div>

                  {/* Progress Bar & Breakdown */}
                  <div className="score-progress-box">
                    <div className="score-progress-header">
                      <span>Opportunity Fit</span>
                      <span>{score}% ({label})</span>
                    </div>
                    <div className="score-progress-track">
                      <div
                        className={`score-progress-fill ${fillClass}`}
                        style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                      />
                    </div>
                    {(breakdown.skillScore !== undefined || breakdown.branchScore !== undefined) && (
                      <div className="score-breakdown-row">
                        {breakdown.skillScore !== undefined && (
                          <span className="score-breakdown-chip">
                            Skill Match: +{breakdown.skillScore} pts
                          </span>
                        )}
                        {breakdown.branchScore !== undefined && (
                          <span className="score-breakdown-chip">
                            Branch Fit: +{breakdown.branchScore} pts
                          </span>
                        )}
                        {breakdown.industryScore !== undefined && (
                          <span className="score-breakdown-chip">
                            Industry: +{breakdown.industryScore} pts
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reason Callout */}
                  {job.reason && (
                    <div className="rec-reason-callout">
                      <div className="reason-label">
                        <span>🎯</span> Why Recommended
                      </div>
                      <div>{job.reason}</div>
                    </div>
                  )}

                  {/* Matched Skills */}
                  <div className="rec-skills-section">
                    <div className="rec-section-heading">
                      Matched Skills ({matchedSkills.length}):
                    </div>
                    {matchedSkills.length > 0 ? (
                      <div className="skills-cluster">
                        {matchedSkills.map((skill) => (
                          <span key={skill} className="skill-pill-matched">
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        No direct required skills overlap detected.
                      </span>
                    )}
                  </div>

                  {/* Alumni Poster Info if available */}
                  {poster.name && (
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-muted)',
                        backgroundColor: 'var(--color-bg-subtle)',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: 'var(--space-4)',
                      }}
                    >
                      Posted by alumnus <strong>{poster.name}</strong>
                      {poster.designation ? ` (${poster.designation})` : ''}
                    </div>
                  )}

                  {/* Card Bottom: View Details Button */}
                  <div className="rec-card-footer">
                    <Link to={`/jobs/${job.jobId}`} style={{ textDecoration: 'none' }}>
                      <Button variant="outline" size="sm">
                        View Opportunity Details →
                      </Button>
                    </Link>
                    <Link to={`/jobs/${job.jobId}`} style={{ textDecoration: 'none' }}>
                      <Button variant="primary" size="sm">
                        Request Referral 🤝
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
