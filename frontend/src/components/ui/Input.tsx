import React from 'react';
import { theme } from '../../styles/theme.js';

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  name?: string;
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
  name
}) => {
  const baseStyles = {
    width: '100%',
    padding: icon ? '0.75rem 1rem 0.75rem 2.5rem' : '0.75rem 1rem',
    border: `1px solid ${error ? theme.colors.error[300] : theme.colors.gray[300]}`,
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.primary,
    backgroundColor: disabled ? theme.colors.gray[50] : 'white',
    color: disabled ? theme.colors.gray[500] : theme.colors.gray[900],
    transition: 'all 0.2s ease-in-out',
    outline: 'none'
  };

  const focusStyles = {
    borderColor: error ? theme.colors.error[500] : theme.colors.primary[500],
    boxShadow: `0 0 0 3px ${error ? 
      theme.colors.error[100] : 
      'rgb(59 130 246 / 0.1)'}`
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
            <span style={{ color: theme.colors.error[500], marginLeft: '2px' }}>*</span>
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
          style={baseStyles}
          onFocus={(e) => {
            Object.assign(e.target.style, focusStyles);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? theme.colors.error[300] : theme.colors.gray[300];
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>
      
      {error && (
        <p 
          style={{
            marginTop: theme.spacing[1],
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.error[600],
            fontFamily: theme.typography.fontFamily.primary
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;