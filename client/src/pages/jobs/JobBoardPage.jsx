import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobService from '../../services/jobService';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import './Jobs.css';

const EMPLOYMENT_TYPES = [
  { value: '', label: 'All Employment Types' },
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'REMOTE', label: 'Remote' },
];

const EXPERIENCE_LEVELS = [
  { value: '', label: 'All Experience Levels' },
  { value: 'ENTRY', label: 'Entry Level' },
  { value: 'MID', label: 'Mid Level' },
  { value: 'SENIOR', label: 'Senior Level' },
  { value: 'LEAD', label: 'Lead / Executive' },
];

export default function JobBoardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [company, setCompany] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [recommendedMode, setRecommendedMode] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!recommendedMode) {
      jobService
        .getJobs({
          search: search.trim() || undefined,
          company: company.trim() || undefined,
          location: locationFilter.trim() || undefined,
          skill: skillFilter.trim() || undefined,
          employmentType: employmentType || undefined,
          experienceLevel: experienceLevel || undefined,
          page,
          limit,
        })
        .then((res) => {
          if (!isMounted) return;
          if (res?.data) {
            setJobs(res.data.jobs || []);
            if (res.data.pagination) {
              setPagination(res.data.pagination);
            }
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          setError(err.message || 'Failed to load job listings.');
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [search, company, locationFilter, skillFilter, employmentType, experienceLevel, page, limit, recommendedMode]);

  const loadRecommendations = async () => {
    setRecLoading(true);
    setError(null);
    try {
      const res = await jobService.getRecommendedJobs({ limit: 12 });
      if (res?.data) {
        setRecommendedJobs(res.data || []);
      }
      setRecommendedMode(true);
    } catch (err) {
      setError(err.message || 'Failed to calculate job recommendations.');
    } finally {
      setRecLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setCompany('');
    setLocationFilter('');
    setSkillFilter('');
    setEmploymentType('');
    setExperienceLevel('');
    setPage(1);
    setRecommendedMode(false);
  };

  const isAlumni = user?.role === 'ALUMNI' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const displayedJobs = recommendedMode ? recommendedJobs : jobs;

  return (
    <div className="jobs-page container">
      <div className="jobs-header">
        <div className="jobs-header-main">
          <div className="badge-strip" style={{ marginBottom: 'var(--space-2)' }}>
            <span className="badge badge-primary">CAREER OPPORTUNITIES</span>
            {recommendedMode && (
              <span className="badge badge-success">AI MATCHING ACTIVE</span>
            )}
          </div>
          <h1 className="jobs-title">
            <span>💼</span> Collegiate Job & Internship Board
          </h1>
          <p className="jobs-subtitle">
            Explore verified career openings and internal referral opportunities posted by our alumni network.
          </p>
        </div>

        <div className="jobs-header-actions">
          {isStudent && (
            <Button
              variant={recommendedMode ? 'secondary' : 'outline'}
              size="md"
              onClick={
                recommendedMode
                  ? () => setRecommendedMode(false)
                  : loadRecommendations
              }
              isLoading={recLoading}
            >
              {recommendedMode ? 'Browse All Jobs' : '✨ Recommended For Me'}
            </Button>
          )}

          {isAlumni && (
            <>
              <Link to="/jobs/my">
                <Button variant="outline" size="md">
                  My Posted Jobs
                </Button>
              </Link>
              <Link to="/jobs/create">
                <Button variant="primary" size="md">
                  + Post Opportunity
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {!recommendedMode && (
        <Card className="jobs-filter-card">
          <div className="jobs-filter-grid">
            <Input
              label="Search Job Title / Keywords"
              placeholder="e.g. Full Stack Engineer, React, Cloud"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            <Input
              label="Location"
              placeholder="e.g. Remote, Seattle, NY"
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setPage(1);
              }}
            />

            <Input
              label="Skill keyword"
              placeholder="e.g. React, Python, PostgreSQL"
              value={skillFilter}
              onChange={(e) => {
                setSkillFilter(e.target.value);
                setPage(1);
              }}
            />

            <Select
              label="Employment Type"
              options={EMPLOYMENT_TYPES}
              value={employmentType}
              onChange={(e) => {
                setEmploymentType(e.target.value);
                setPage(1);
              }}
            />

            <Select
              label="Experience Level"
              options={EXPERIENCE_LEVELS}
              value={experienceLevel}
              onChange={(e) => {
                setExperienceLevel(e.target.value);
                setPage(1);
              }}
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              style={{ marginBottom: 'var(--space-1)' }}
            >
              Reset Filters
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Loading message="Scanning opportunity board..." fullScreen={false} />
      ) : displayedJobs.length === 0 ? (
        <div className="jobs-empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            🔍
          </span>
          <h3 className="empty-state-title">No opportunities found</h3>
          <p className="empty-state-desc">
            {recommendedMode
              ? 'No high-scoring matches currently align with your profile. Try updating your skills or browse all jobs.'
              : 'Try clearing your filters or searching with different keywords.'}
          </p>
          <Button variant="outline" onClick={handleResetFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="jobs-grid">
          {displayedJobs.map((job) => {
            const jobId = job.id || job.jobId;
            const employmentTypeLabel = job.employmentType
              ? job.employmentType.replace('_', ' ')
              : 'Full Time';
            const badgeClass =
              job.employmentType === 'INTERNSHIP'
                ? 'badge-internship'
                : job.employmentType === 'REMOTE'
                ? 'badge-remote'
                : 'badge-full-time';

            const poster = job.postedBy || {};
            const posterInitial = poster.name ? poster.name.charAt(0).toUpperCase() : 'A';

            return (
              <Card key={jobId} className="job-card" hoverable>
                <div className="job-card-header">
                  <div>
                    <h3 className="job-card-title">{job.title}</h3>
                    <div className="job-card-company">
                      <span>🏢</span> {job.company}
                    </div>
                  </div>
                  {job.matchScore !== undefined && (
                    <span className="job-badge badge-match">
                      🎯 {job.matchScore}% Match
                    </span>
                  )}
                </div>

                <div className="job-badges-strip">
                  <span className={`job-badge ${badgeClass}`}>
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

                <div className="job-card-snippet">
                  {job.description}
                </div>

                {job.reason && (
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-success)',
                      backgroundColor: 'var(--color-success-bg)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    💡 {job.reason}
                  </div>
                )}

                <div className="job-card-meta">
                  {job.deadline && (
                    <div className="job-meta-item">
                      <span>⏳</span>
                      <span>
                        Deadline:{' '}
                        {new Date(job.deadline).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {job.createdAt && (
                    <div className="job-meta-item">
                      <span>📅</span>
                      <span>
                        Posted on{' '}
                        {new Date(job.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="job-card-footer">
                  <div className="job-poster-info">
                    <span className="poster-avatar-mini">{posterInitial}</span>
                    <span>Posted by {poster.name || 'Alumnus'}</span>
                  </div>

                  <Link to={`/jobs/${jobId}`}>
                    <Button variant="secondary" size="sm">
                      View Details →
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!recommendedMode && pagination.totalPages > 1 && (
        <div className="jobs-pagination">
          <div className="pagination-info">
            Showing Page <strong>{pagination.page}</strong> of{' '}
            <strong>{pagination.totalPages}</strong> ({pagination.total} opportunities)
          </div>

          <div className="pagination-controls">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
