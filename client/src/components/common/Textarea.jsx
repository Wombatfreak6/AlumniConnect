import React, { useId } from 'react';
import './Form.css';

/**
 * Reusable Textarea Component
 */
export default function Textarea({
  label,
  id,
  name,
  value,
  onChange,
  rows = 4,
  placeholder = '',
  required = false,
  error = '',
  helpText = '',
  disabled = false,
  className = '',
  ...props
}) {
  const generatedId = useId();
  const textareaId = id || name || generatedId;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label}
          {required && <span className="form-label-required" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        className={`form-control ${error ? 'form-control-error' : ''}`}
        {...props}
      />
      {error && <span className="form-error-msg" role="alert">{error}</span>}
      {helpText && !error && <span className="form-help-text">{helpText}</span>}
    </div>
  );
}
