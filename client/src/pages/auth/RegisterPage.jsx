import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ErrorAlert from '../../components/common/ErrorAlert';
import './Auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (formError) setFormError('');
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'University email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    // Simulating quick client validation navigation for prototype phase
    setTimeout(() => {
      setIsSubmitting(false);
      if (formData.role === 'ALUMNI') {
        navigate('/alumni');
      } else {
        navigate('/student');
      }
    }, 600);
  };

  return (
    <Card className="auth-form-card">
      <div className="auth-header">
        <h1 className="auth-title">Create Your Account</h1>
        <p className="auth-description">
          Join the verified AlumniConnect university community
        </p>
      </div>

      {formError && (
        <ErrorAlert
          message={formError}
          onDismiss={() => setFormError('')}
        />
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Role Toggle Selector */}
        <div>
          <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>
            I am joining as a <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <div className="role-selector-group">
            <button
              type="button"
              className={`role-option ${formData.role === 'STUDENT' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('STUDENT')}
            >
              🎒 Current Student
            </button>
            <button
              type="button"
              className={`role-option ${formData.role === 'ALUMNI' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('ALUMNI')}
            >
              🎓 Graduated Alumni
            </button>
          </div>
        </div>

        <Input
          label="Full Name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Aarav Sharma"
          error={errors.name}
          required
        />

        <Input
          label="Institutional / Collegiate Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your.name@college.edu"
          helpText="Please use your campus email if available."
          error={errors.email}
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Minimum 8 characters"
          helpText="Must be at least 8 characters with letters and numbers."
          error={errors.password}
          required
        />

        <div className="auth-actions">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
          >
            Create {formData.role === 'ALUMNI' ? 'Alumni' : 'Student'} Account
          </Button>
        </div>
      </form>

      <p className="auth-footer-prompt">
        Already have an account?{' '}
        <Link to="/login" className="auth-footer-link">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
