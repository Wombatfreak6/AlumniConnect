import React from 'react';
import './Loading.css';

/**
 * Reusable Loading Spinner Component
 */
export default function Loading({
  message = 'Loading...',
  fullScreen = false,
  className = '',
}) {
  return (
    <div
      className={`loading-container ${fullScreen ? 'loading-fullscreen' : ''} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="loading-spinner" aria-hidden="true" />
      {message && <span className="loading-text">{message}</span>}
    </div>
  );
}
