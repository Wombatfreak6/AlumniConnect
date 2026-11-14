import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar({
  role = 'STUDENT',
  title = 'Dashboard',
  items = [],
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-role-badge">{role} PORTAL</span>
        <h2 className="sidebar-title">{title}</h2>
      </div>

      <nav>
        <ul className="sidebar-nav">
          {items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `sidebar-item-link ${isActive ? 'active' : ''}`
                }
              >
                <div className="sidebar-item-left">
                  {item.icon && <span className="sidebar-item-icon">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="sidebar-badge">{item.badge}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <p>AlumniConnect v1.0.0</p>
        <p>Final Integrated Release</p>
      </div>
    </aside>
  );
}
