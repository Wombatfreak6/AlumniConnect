import React, { useId } from 'react';
import './Form.css';

export default function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  helpText = '',
  disabled = false,
  className = '',
  ...props
}) {
  const generatedId = useId();
  const inputId = id || name || generatedId;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="form-label-required" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`form-control ${error ? 'form-control-error' : ''}`}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} className="form-error-msg" role="alert">
          {error}
        </span>
      )}
      {helpText && !error && <span className="form-help-text">{helpText}</span>}
    </div>
  );
}
