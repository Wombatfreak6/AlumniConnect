import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h4>🎓 AlumniConnect</h4>
            <p>
              Intelligent Platform to Interconnect Alumni and Students. Bridging
              academic journeys with professional excellence through mentorship,
              referrals, and institutional engagement.
            </p>
          </div>

          <div className="footer-col">
            <h5>Students</h5>
            <ul className="footer-links">
              <li><Link to="/student">Student Hub</Link></li>
              <li><Link to="/profile">My Profile</Link></li>
              <li><Link to="/student">Find Mentors</Link></li>
              <li><Link to="/student">Explore Jobs</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Alumni</h5>
            <ul className="footer-links">
              <li><Link to="/alumni">Alumni Portal</Link></li>
              <li><Link to="/alumni">Offer Mentorship</Link></li>
              <li><Link to="/alumni">Post Referrals</Link></li>
              <li><Link to="/profile">Update Career</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Administration</h5>
            <ul className="footer-links">
              <li><Link to="/admin">Admin Dashboard</Link></li>
              <li><Link to="/admin">User Directory</Link></li>
              <li><Link to="/admin">System Metrics</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {CURRENT_YEAR} AlumniConnect Platform. All rights reserved.</p>
          <p>Built with React & Vite • PostgreSQL & Prisma • Node.js</p>
        </div>
      </div>
    </footer>
  );
}
