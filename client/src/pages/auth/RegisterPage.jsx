import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ErrorAlert from '../../components/common/ErrorAlert';
import useAuth from '../../hooks/useAuth';
import './Auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const handleRoleSelect = (role) => {
    // Ensure only STUDENT or ALUMNI can ever be selected
    if (role === 'STUDENT' || role === 'ALUMNI') {
      setFormData((prev) => ({ ...prev, role }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // 1. Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long.';
    }

    // 2. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }

    // 3. Password validation (matching backend rules)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.';
    }

    // 4. Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    // 5. Role validation
    if (formData.role !== 'STUDENT' && formData.role !== 'ALUMNI') {
      newErrors.role = 'Please select a valid account type.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
      });

      // Redirect directly to the newly registered user's dashboard
      if (user.role === 'ALUMNI') {
        navigate('/alumni', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err) {
      setApiError(
        err.message || 'Registration failed. Please check your information and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="auth-form-card">
      <div className="auth-header">
        <h1 className="auth-title">Create Your Account</h1>
        <p className="auth-description">
          Join the verified AlumniConnect university community
        </p>
      </div>

      {apiError && (
        <ErrorAlert
          message={apiError}
          onDismiss={() => setApiError('')}
        />
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Account Type Selector: Strictly Student and Alumni only */}
        <div>
          <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>
            Account Type <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <div className="role-selector-group">
            <button
              type="button"
              className={`role-option ${formData.role === 'STUDENT' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('STUDENT')}
            >
              🎒 Student
            </button>
            <button
              type="button"
              className={`role-option ${formData.role === 'ALUMNI' ? 'selected' : ''}`}
              onClick={() => handleRoleSelect('ALUMNI')}
            >
              🎓 Alumni
            </button>
          </div>
          {errors.role && <p className="form-error">{errors.role}</p>}
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
          label="University / Collegiate Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your.name@college.edu"
          helpText="Please use your campus email address."
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
          helpText="Must include at least 1 uppercase letter, 1 lowercase letter, and 1 number."
          error={errors.password}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter password"
          error={errors.confirmPassword}
          required
        />

        <div className="auth-actions">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
          >
            Register as {formData.role === 'ALUMNI' ? 'Alumni' : 'Student'}
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
