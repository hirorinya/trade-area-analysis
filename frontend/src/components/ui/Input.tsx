import React from 'react';
import { theme } from '../../styles/theme.js';

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  name?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  label,
  error,
  required = false,
  disabled = false,
  icon,
  className = '',
  name,
  min,
  max,
  step
}) => {
  // Get base input styles from theme
  const baseInputStyles = theme.components.input.base;
  
  const inputStyles = {
    ...baseInputStyles,
    padding: icon ? '0.75rem 1rem 0.75rem 2.5rem' : baseInputStyles.padding,
    borderColor: error ? theme.colors.error[600] : baseInputStyles.border.split(' ')[2],
    backgroundColor: disabled ? theme.colors.gray[50] : baseInputStyles.backgroundColor,
    color: disabled ? theme.colors.gray[500] : baseInputStyles.color,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text'
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!disabled) {
      if (error) {
        Object.assign(e.target.style, baseInputStyles[':error']);
      } else {
        Object.assign(e.target.style, baseInputStyles[':focus']);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!disabled) {
      e.target.style.borderColor = error ? theme.colors.error[600] : theme.colors.gray[300];
      e.target.style.boxShadow = 'none';
    }
  };

  return (
    <div className={className} style={{ width: '100%' }}>
      {label && (
        <label 
          style={{
            display: 'block',
            marginBottom: theme.spacing[2],
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.gray[700],
            fontFamily: theme.typography.fontFamily.primary
          }}
        >
          {label}
          {required && (
            <span style={{ color: theme.colors.error[600], marginLeft: '2px' }}>*</span>
          )}
        </label>
      )}
      
      <div style={{ position: 'relative', width: '100%' }}>
        {icon && (
          <div 
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.colors.gray[400],
              pointerEvents: 'none',
              zIndex: 1
            }}
          >
            {icon}
          </div>
        )}
        
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          style={inputStyles}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </div>
      
      {error && (
        <p 
          id={`${name}-error`}
          style={{
            marginTop: theme.spacing[1],
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.error[600],
            fontFamily: theme.typography.fontFamily.primary
          }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;