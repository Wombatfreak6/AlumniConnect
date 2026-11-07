import React from 'react';
import Card from '../common/Card';
import './StatCard.css';

/**
 * StatCard - Metric indicator card for dashboards
 *
 * @param {string} title - Metric label (e.g., "Active Mentors")
 * @param {string|number} value - Metric value (e.g., "148" or "94%")
 * @param {string} [subtitle] - Context label or period (e.g., "+12% this month")
 * @param {React.ReactNode} [icon] - Visual icon or emoji
 * @param {'neutral'|'success'|'warning'|'primary'} [variant='primary']
 */
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
