import React from 'react';
import { theme } from '../../styles/theme.js';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  hover = false
}) => {
  const paddingValues = {
    sm: theme.spacing[4],
    md: theme.spacing[6],
    lg: theme.spacing[8]
  };

  const shadowValues = {
    sm: theme.shadows.sm,
    md: theme.shadows.md,
    lg: theme.shadows.lg
  };

  const baseStyles = {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.xl,
    boxShadow: shadowValues[shadow],
    padding: paddingValues[padding],
    border: `1px solid ${theme.colors.gray[100]}`,
    transition: 'all 0.2s ease-in-out'
  };

  const hoverStyles = hover ? {
    ':hover': {
      boxShadow: theme.shadows.lg,
      transform: 'translateY(-2px)',
      borderColor: theme.colors.gray[200]
    }
  } : {};

  return (
    <div
      className={className}
      style={baseStyles}
      onMouseEnter={(e) => {
        if (hover) {
          e.target.style.boxShadow = theme.shadows.lg;
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.borderColor = theme.colors.gray[200];
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.target.style.boxShadow = shadowValues[shadow];
          e.target.style.transform = 'translateY(0)';
          e.target.style.borderColor = theme.colors.gray[100];
        }
      }}
    >
      {children}
    </div>
  );
};

export default Card;