import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ErrorAlert from '../../components/common/ErrorAlert';
import './Auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    // Simulating quick client validation navigation for prototype phase
    setTimeout(() => {
      setIsSubmitting(false);
      // Determine destination based on email or default to student
      if (formData.email.includes('admin')) {
        navigate('/admin');
      } else if (formData.email.includes('alumni')) {
        navigate('/alumni');
      } else {
        navigate('/student');
      }
    }, 600);
  };

  return (
    <Card className="auth-form-card">
      <div className="auth-header">
        <h1 className="auth-title">Sign in to AlumniConnect</h1>
        <p className="auth-description">
          Enter your collegiate email to access your network and dashboard
        </p>
      </div>

      {formError && (
        <ErrorAlert
          message={formError}
          onDismiss={() => setFormError('')}
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
            fullWidth
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

      {/* Quick Access Switcher for Prototype Review */}
      <div className="auth-demo-box">
        <div className="auth-demo-title">Direct Portal Preview</div>
        <div className="auth-demo-buttons">
          <Button size="sm" variant="outline" onClick={() => navigate('/student')}>
            Student Portal
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/alumni')}>
            Alumni Portal
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/admin')}>
            Admin Portal
          </Button>
        </div>
      </div>
    </Card>
  );
}
