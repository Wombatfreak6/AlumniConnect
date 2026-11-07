import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import './Navbar.css';

/**
 * Main Application Top Navbar
 */
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

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
              <li>
                <NavLink to="/student" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  Student Hub
                </NavLink>
              </li>
              <li>
                <NavLink to="/alumni" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  Alumni Portal
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  Admin
                </NavLink>
              </li>
              <li>
                <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  Profile
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="navbar-actions">
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
          </div>
        </div>
      </div>
    </header>
  );
}
