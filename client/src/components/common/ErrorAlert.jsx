import React from 'react';
import './ErrorAlert.css';
import Button from './Button';

/**
 * Reusable Error Alert Component
 */
export default function ErrorAlert({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) {
  if (!message) return null;

  return (
    <div className={`error-alert ${className}`} role="alert">
      <svg
        className="error-alert-icon"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      </svg>
      <div className="error-alert-content">
        {title && <div className="error-alert-title">{title}</div>}
        <div className="error-alert-message">{message}</div>
        {onRetry && (
          <div className="error-alert-actions">
            <Button size="sm" variant="danger" onClick={onRetry}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
