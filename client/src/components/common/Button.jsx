import React from 'react';
import './Button.css';

/**
 * Reusable Button Component
 * Supports variants: primary, secondary, outline, danger, ghost
 * Sizes: sm, md, lg
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  fullWidth = false,
  isLoading = false,
  disabled = false,
  type = 'button',
  icon = null,
  className = '',
  onClick,
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    block || fullWidth ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="btn-spinner" aria-hidden="true" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
