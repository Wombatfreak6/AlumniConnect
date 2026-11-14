import React from 'react';
import Card from '../common/Card';
import './StatCard.css';

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'primary',
}) {
  return (
    <Card className={`stat-card stat-card-${variant}`}>
      <div className="stat-card-content">
        <div className="stat-card-info">
          <p className="stat-card-title">{title}</p>
          <h3 className="stat-card-value">{value}</h3>
          {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
        </div>
        {icon && (
          <div className="stat-card-icon" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
