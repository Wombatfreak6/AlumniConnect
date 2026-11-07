import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-code">404</span>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-desc">
          The page or resource you requested does not exist or has been moved within the AlumniConnect platform.
        </p>
        <div className="not-found-actions">
          <Link to="/">
            <Button variant="primary">Return to Homepage</Button>
          </Link>
          <Link to="/student">
            <Button variant="outline">Go to Student Hub</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
