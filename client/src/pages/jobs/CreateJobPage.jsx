import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import jobService from '../../services/jobService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import ErrorAlert from '../../components/common/ErrorAlert';
import './Jobs.css';

const EMPLOYMENT_TYPES = [
  { value: '', label: 'Select Employment Type...' },
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'REMOTE', label: 'Remote' },
];

const EXPERIENCE_LEVELS = [
  { value: '', label: 'Select Experience Level...' },
  { value: 'ENTRY', label: 'Entry Level (0-2 years)' },
  { value: 'MID', label: 'Mid Level (2-5 years)' },
  { value: 'SENIOR', label: 'Senior Level (5+ years)' },
  { value: 'LEAD', label: 'Lead / Principal / Executive' },
];

export default function CreateJobPage() {
  const navigate = useNavigate();

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
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const validate = () => {
    const errors = {};

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errors.title = 'Job title must be at least 3 characters long.';
    }

    if (!formData.company.trim() || formData.company.trim().length < 2) {
      errors.company = 'Company name is required.';
    }

    if (!formData.location.trim() || formData.location.trim().length < 2) {
      errors.location = 'Location is required (e.g. Remote, City, State).';
    }

    if (!formData.employmentType) {
      errors.employmentType = 'Please select an employment type.';
    }

    if (!formData.experienceLevel) {
      errors.experienceLevel = 'Please select a required experience level.';
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

    if (formData.deadline) {
      const selected = new Date(formData.deadline);
      if (isNaN(selected.getTime())) {
        errors.deadline = 'Please enter a valid date.';
      } else if (selected <= new Date()) {
        errors.deadline = 'Deadline must be a future date.';
      }
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

      const res = await jobService.createJob(payload);
      if (res?.data?.job?.id) {
        navigate(`/jobs/${res.data.job.id}`, { replace: true });
      } else {
        navigate('/jobs/my', { replace: true });
      }
    } catch (err) {
      setApiError(err.message || 'Failed to publish job posting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="jobs-page container" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link to="/jobs" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="sm">
            ← Back to Job Board
          </Button>
        </Link>
      </div>

      <Card
        title="Post a Career Opportunity"
        subtitle="Share job or internship openings directly with collegiate students and alumni peers"
      >
        {apiError && <ErrorAlert message={apiError} onDismiss={() => setApiError(null)} />}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Job / Opportunity Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Senior Full Stack Engineer, Cloud Platform"
            required
            error={formErrors.title}
            helpText="Be descriptive so matching algorithms accurately detect relevant skills."
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input
              label="Hiring Company / Organization"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g. Google, Microsoft, Startup Inc."
              required
              error={formErrors.company}
            />

            <Input
              label="Work Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Remote, San Francisco, CA, Hybrid"
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
              placeholder="https://company.com/careers/role-id"
              error={formErrors.applicationUrl}
              helpText="Direct careers link for students to submit external applications."
            />

            <Input
              label="Application Deadline (Optional)"
              name="deadline"
              type="date"
              value={formData.deadline}
              onChange={handleChange}
              error={formErrors.deadline}
            />
          </div>

          <Textarea
            label="Role Overview, Responsibilities & Required Skills"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={8}
            placeholder="Describe role responsibilities, tech stack (e.g. Python, React, PostgreSQL), qualifications, and team culture..."
            required
            error={formErrors.description}
            helpText="Include technical skills explicitly to maximize student matching recommendations."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <Link to="/jobs">
              <Button variant="ghost" type="button">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" type="submit" isLoading={submitting}>
              Publish Opportunity 🚀
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

