import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import './AuthLayout.css';

const CURRENT_YEAR = new Date().getFullYear();

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-top-bar">
        <Link to="/" className="auth-home-link">
          <span className="auth-brand-icon">🎓</span>
          <span className="auth-brand-name">AlumniConnect</span>
        </Link>
        <Link to="/" className="auth-back-link">
          ← Back to Homepage
        </Link>
      </div>

      <main className="auth-main">
        <div className="auth-card-wrapper">
          <Outlet />
        </div>
      </main>

      <footer className="auth-footer">
        <p>© {CURRENT_YEAR} AlumniConnect. Secure Institutional Portal.</p>
      </footer>
    </div>
  );
}
