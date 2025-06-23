import React from 'react';
import { theme } from '../../styles/theme.js';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'small' | 'standard' | 'large' | 'xlarge';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'standard',
  hover = true
}) => {
  // Padding values according to design guidelines
  const paddingValues = {
    small: theme.spacing[4],     // p-4 (16px)
    standard: theme.spacing[5],  // p-5 (20px) 
    large: theme.spacing[6],     // p-6 (24px)
    xlarge: theme.spacing[8]     // p-8 (32px)
  };

  // Get base card styles from theme
  const baseCardStyles = theme.components.card.base;

  const baseStyles = {
    ...baseCardStyles,
    padding: paddingValues[padding],
    fontFamily: theme.typography.fontFamily.primary
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hover && baseCardStyles[':hover']) {
      Object.assign(e.currentTarget.style, baseCardStyles[':hover']);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hover) {
      Object.assign(e.currentTarget.style, {
        boxShadow: baseCardStyles.boxShadow,
        borderColor: baseCardStyles.border.split(' ')[2] // Extract border color
      });
    }
  };

  return (
    <div
      className={className}
      style={baseStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

export default Card;