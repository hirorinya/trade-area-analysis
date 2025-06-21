import React from 'react';
import { theme } from '../../styles/theme.js';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  icon
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.medium,
    borderRadius: theme.borderRadius.lg,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    textDecoration: 'none',
    opacity: disabled ? 0.6 : 1
  };

  const variants = {
    primary: {
      backgroundColor: theme.colors.primary[500],
      color: 'white',
      boxShadow: theme.shadows.sm,
      ':hover': !disabled ? {
        backgroundColor: theme.colors.primary[600],
        boxShadow: theme.shadows.md,
        transform: 'translateY(-1px)'
      } : {}
    },
    secondary: {
      backgroundColor: 'white',
      color: theme.colors.gray[700],
      border: `1px solid ${theme.colors.gray[300]}`,
      ':hover': !disabled ? {
        backgroundColor: theme.colors.gray[50],
        borderColor: theme.colors.gray[400]
      } : {}
    },
    success: {
      backgroundColor: theme.colors.success[500],
      color: 'white',
      ':hover': !disabled ? {
        backgroundColor: theme.colors.success[600]
      } : {}
    },
    danger: {
      backgroundColor: theme.colors.error[500],
      color: 'white',
      ':hover': !disabled ? {
        backgroundColor: theme.colors.error[600]
      } : {}
    }
  };

  const sizes = {
    sm: {
      padding: '0.5rem 1rem',
      fontSize: theme.typography.fontSize.sm,
      minHeight: '2rem'
    },
    md: {
      padding: '0.75rem 1.5rem',
      fontSize: theme.typography.fontSize.sm,
      minHeight: '2.5rem'
    },
    lg: {
      padding: '1rem 2rem',
      fontSize: theme.typography.fontSize.base,
      minHeight: '3rem'
    }
  };

  const combinedStyles = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size]
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={combinedStyles}
      onMouseEnter={(e) => {
        if (!disabled && variants[variant][':hover']) {
          Object.assign(e.target.style, variants[variant][':hover']);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          Object.assign(e.target.style, variants[variant]);
        }
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;