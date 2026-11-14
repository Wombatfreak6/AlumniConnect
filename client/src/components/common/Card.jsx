import React from 'react';
import './Card.css';

export default function Card({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  hoverable = false,
  className = '',
  ...props
}) {
  const hasHeader = title || subtitle || headerAction;

  return (
    <div
      className={`card ${hoverable ? 'card-hoverable' : ''} ${className}`}
      {...props}
    >
      {hasHeader && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {headerAction && <div className="card-header-action">{headerAction}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
