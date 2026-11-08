import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import useAuth from '../../hooks/useAuth';
import './Navbar.css';

/**
 * Main Application Top Navbar
 * Dynamically displays authenticated user profile, role-specific navigation, and logout action.
 */
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    closeMobileMenu();
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <span className="navbar-brand-icon" aria-hidden="true">🎓</span>
          <span>AlumniConnect</span>
        </Link>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="navbar-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Navigation Links and Actions */}
        <div className={`navbar-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <nav>
            <ul className="navbar-nav">
              <li>
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  Home
                </NavLink>
              </li>

              {/* Student Hub: visible if guest or student/admin */}
              {(!isAuthenticated || user?.role === 'STUDENT' || user?.role === 'ADMIN') && (
                <li>
                  <NavLink to="/student" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                    Student Hub
                  </NavLink>
                </li>
              )}

              {/* Alumni Portal: visible if guest or alumni/admin */}
              {(!isAuthenticated || user?.role === 'ALUMNI' || user?.role === 'ADMIN') && (
                <li>
                  <NavLink to="/alumni" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                    Alumni Portal
                  </NavLink>
                </li>
              )}

              {/* Admin Console: strictly ADMIN only */}
              {user?.role === 'ADMIN' && (
                <li>
                  <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                    Admin Console
                  </NavLink>
                </li>
              )}

              {/* Profile: visible when authenticated */}
              {isAuthenticated && (
                <li>
                  <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                    My Profile
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>

          <div className="navbar-actions">
            {isAuthenticated ? (
              <div className="navbar-auth-user">
                <span className="navbar-user-tag">
                  <span className="navbar-user-name">{user?.name}</span>
                  <span className={`badge badge-${user?.role?.toLowerCase()}`}>{user?.role}</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    closeMobileMenu();
                    navigate('/login');
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    closeMobileMenu();
                    navigate('/register');
                  }}
                >
                  Join Platform
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
