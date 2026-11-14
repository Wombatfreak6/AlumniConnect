import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import jobService from '../../services/jobService';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import './Jobs.css';

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'REMOTE', label: 'Remote' },
];

const EXPERIENCE_LEVELS = [
  { value: 'ENTRY', label: 'Entry Level (0-2 years)' },
  { value: 'MID', label: 'Mid Level (2-5 years)' },
  { value: 'SENIOR', label: 'Senior Level (5+ years)' },
  { value: 'LEAD', label: 'Lead / Principal / Executive' },
];

export default function EditJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    employmentType: 'FULL_TIME',
    experienceLevel: 'ENTRY',
    applicationUrl: '',
    deadline: '',
    description: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    jobService
      .getJobById(id)
      .then((res) => {
        if (!isMounted) return;
        const job = res?.data?.job;

        if (!job) {
          setApiError('Job not found.');
          return;
        }

        const isOwner = user && user.id === job.postedById;
        const isAdmin = user?.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
          setApiError('Forbidden: You can only edit job postings created by your account.');
          return;
        }

        setFormData({
          title: job.title || '',
          company: job.company || '',
          location: job.location || '',
          employmentType: job.employmentType || 'FULL_TIME',
          experienceLevel: job.experienceLevel || 'ENTRY',
          applicationUrl: job.applicationUrl || '',
          deadline: job.deadline ? job.deadline.split('T')[0] : '',
          description: job.description || '',
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        setApiError(err.message || 'Failed to fetch job details.');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  const validate = () => {
    const errors = {};

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errors.title = 'Job title must be at least 3 characters long.';
    }

    if (!formData.company.trim() || formData.company.trim().length < 2) {
      errors.company = 'Company name is required.';
    }

    if (!formData.location.trim() || formData.location.trim().length < 2) {
      errors.location = 'Location is required.';
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long.';
    }

    if (
      formData.applicationUrl &&
      !formData.applicationUrl.startsWith('http://') &&
      !formData.applicationUrl.startsWith('https://')
    ) {
      errors.applicationUrl = 'Application URL must start with http:// or https://';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        company: formData.company.trim(),
        location: formData.location.trim(),
        employmentType: formData.employmentType,
        experienceLevel: formData.experienceLevel,
        description: formData.description.trim(),
        applicationUrl: formData.applicationUrl.trim() || null,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      };

      await jobService.updateJob(id, payload);
      navigate(`/jobs/${id}`, { replace: true });
    } catch (err) {
      setApiError(err.message || 'Failed to update job post.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading message="Retrieving job information..." fullScreen={false} />;
  }

  return (
    <div className="jobs-page container" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link to={`/jobs/${id}`} style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="sm">
            ← Cancel & Back to Opportunity
          </Button>
        </Link>
      </div>

      <Card
        title="Edit Opportunity Posting"
        subtitle="Update role details, qualifications, or application deadlines"
      >
        {apiError && <ErrorAlert message={apiError} />}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Job / Opportunity Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            error={formErrors.title}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input
              label="Hiring Company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
              error={formErrors.company}
            />

            <Input
              label="Work Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              error={formErrors.location}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Select
              label="Employment Type"
              name="employmentType"
              options={EMPLOYMENT_TYPES}
              value={formData.employmentType}
              onChange={handleChange}
              required
              error={formErrors.employmentType}
            />

            <Select
              label="Experience Level"
              name="experienceLevel"
              options={EXPERIENCE_LEVELS}
              value={formData.experienceLevel}
              onChange={handleChange}
              required
              error={formErrors.experienceLevel}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input
              label="External Application Link (Optional)"
              name="applicationUrl"
              type="url"
              value={formData.applicationUrl}
              onChange={handleChange}
              placeholder="https://..."
              error={formErrors.applicationUrl}
            />

            <Input
              label="Application Deadline (Optional)"
              name="deadline"
              type="date"
              value={formData.deadline}
              onChange={handleChange}
            />
          </div>

          <Textarea
            label="Role Overview, Responsibilities & Required Skills"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={8}
            required
            error={formErrors.description}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <Link to={`/jobs/${id}`}>
              <Button variant="ghost" type="button">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
