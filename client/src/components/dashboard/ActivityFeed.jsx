import React from 'react';
import Card from '../common/Card';
import './ActivityFeed.css';

/**
 * ActivityFeed - Reusable activity/announcement timeline widget
 *
 * @param {string} [title="Recent Activity"]
 * @param {Array<{ id: string|number, title: string, description: string, timestamp: string, icon?: string, tag?: string }>} items
 */
export default function ActivityFeed({
  title = 'Recent Activity',
  items = [],
  action,
}) {
  return (
    <Card
      title={title}
      action={action}
      className="activity-feed-card"
    >
      {items.length === 0 ? (
        <p className="activity-empty">No recent activity to display.</p>
      ) : (
        <ul className="activity-list">
          {items.map((item) => (
            <li key={item.id} className="activity-item">
              <div className="activity-icon-container">
                <span className="activity-icon">{item.icon || '📌'}</span>
              </div>
              <div className="activity-content">
                <div className="activity-header">
                  <span className="activity-item-title">{item.title}</span>
                  {item.tag && <span className="activity-tag">{item.tag}</span>}
                </div>
                {item.description && (
                  <p className="activity-item-desc">{item.description}</p>
                )}
                <span className="activity-timestamp">{item.timestamp}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
