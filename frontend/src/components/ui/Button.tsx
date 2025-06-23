import React from 'react';
import { theme } from '../../styles/theme.js';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'standard' | 'large';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'standard',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  icon
}) => {
  // Get base component styles from theme
  const baseComponentStyles = theme.components.button[variant] || theme.components.button.primary;
  const sizeStyles = theme.components.button[size] || {};

  const baseStyles = {
    ...baseComponentStyles,
    ...sizeStyles,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: theme.typography.fontFamily.primary,
    gap: icon ? theme.spacing[2] : '0'
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && baseComponentStyles[':hover']) {
      Object.assign(e.currentTarget.style, baseComponentStyles[':hover']);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      Object.assign(e.currentTarget.style, {
        backgroundColor: baseComponentStyles.backgroundColor,
        boxShadow: baseComponentStyles.boxShadow,
        transform: 'none'
      });
    }
  };

  const handleFocus = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && baseComponentStyles[':focus']) {
      Object.assign(e.currentTarget.style, baseComponentStyles[':focus']);
    }
  };

  const handleBlur = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      Object.assign(e.currentTarget.style, {
        boxShadow: baseComponentStyles.boxShadow
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && baseComponentStyles[':active']) {
      Object.assign(e.currentTarget.style, baseComponentStyles[':active']);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      Object.assign(e.currentTarget.style, {
        transform: 'none'
      });
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={baseStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      aria-disabled={disabled}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;