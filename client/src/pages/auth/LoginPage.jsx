import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ErrorAlert from '../../components/common/ErrorAlert';
import useAuth from '../../hooks/useAuth';
import { getDefaultDashboardPath } from '../../utils/navigation';
import './Auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

  const validate = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
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
      const user = await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      // Send the user back to the page that redirected them here, if there was one.
      const destination = location.state?.from?.pathname || getDefaultDashboardPath(user.role);
      navigate(destination, { replace: true });
    } catch (err) {
      setApiError(
        err.message || 'Invalid email or password. Please check your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="auth-form-card">
      <div className="auth-header">
        <h1 className="auth-title">Sign in to AlumniConnect</h1>
        <p className="auth-description">
          Enter your collegiate credentials to access your dashboard
        </p>
      </div>

      {apiError && (
        <ErrorAlert
          message={apiError}

        />
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Input
          label="Collegiate Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your.name@college.edu"
          error={errors.email}
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••••••"
          error={errors.password}
          required
        />

        <div className="auth-actions">
          <Button
            type="submit"
            variant="primary"
            block
            isLoading={isSubmitting}
          >
            Sign In
          </Button>
        </div>
      </form>

      <p className="auth-footer-prompt">
        Don&apos;t have an account yet?{' '}
        <Link to="/register" className="auth-footer-link">
          Register here
        </Link>
      </p>

    </Card>
  );
}
