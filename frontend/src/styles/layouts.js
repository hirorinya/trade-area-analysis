// Layout System following Apple-Style Design Guidelines
import { theme } from './theme.js';

// Container (Design Guidelines)
export const containerStyle = {
  maxWidth: '1024px',  // max-w-4xl
  width: '100%',
  margin: '0 auto',    // mx-auto
  padding: '2rem 1rem', // py-8 px-4 (mobile)
  fontFamily: theme.typography.fontFamily.primary,
  backgroundColor: theme.colors.background.default,
  minHeight: '100vh',
  
  // Responsive padding
  '@media (min-width: 640px)': {
    padding: '3rem 1.5rem' // py-12 px-6 (sm)
  },
  '@media (min-width: 1024px)': {
    padding: '4rem 2rem' // py-16 px-8 (lg)
  }
};

// Section spacing (Design Guidelines)
export const sectionStyle = {
  marginBottom: theme.spacing[8], // space-y-8 (32px between sections)
};

export const majorSectionStyle = {
  marginBottom: theme.spacing[12], // space-y-12 (48px major sections)
};

// Header styles
export const headerStyle = {
  textAlign: 'center',
  marginBottom: theme.spacing[8],
  borderBottom: `1px solid ${theme.colors.gray[200]}`,
  paddingBottom: theme.spacing[6]
};

export const titleStyle = {
  fontSize: theme.typography.fontSize['4xl'],   // text-4xl (36px)
  fontWeight: theme.typography.fontWeight.bold, // font-bold (700)
  color: theme.colors.gray[900],                // Primary Text
  margin: 0,
  marginBottom: theme.spacing[2],
  lineHeight: 1.25,                            // leading-tight
  fontFamily: theme.typography.fontFamily.primary
};

export const subtitleStyle = {
  fontSize: theme.typography.fontSize.lg,       // text-lg (18px)
  color: theme.colors.gray[600],               // Caption Text
  margin: 0,
  fontWeight: theme.typography.fontWeight.normal,
  lineHeight: 1.6                             // leading-relaxed
};

// Grid layouts
export const gridStyle = {
  display: 'grid',
  gap: theme.spacing[6], // gap-6 (24px)
  gridTemplateColumns: '1fr',
  
  // Responsive grid
  '@media (min-width: 768px)': {
    gridTemplateColumns: 'repeat(2, 1fr)' // md:grid-cols-2
  },
  '@media (min-width: 1024px)': {
    gridTemplateColumns: 'repeat(3, 1fr)' // lg:grid-cols-3
  }
};

// Form layouts
export const formStyle = {
  backgroundColor: theme.colors.background.default,
  border: `1px solid ${theme.colors.gray[300]}`,
  borderRadius: theme.borderRadius['2xl'],      // rounded-2xl (16px)
  padding: theme.spacing[6],                   // p-6 (24px)
  boxShadow: theme.shadows.sm,
  marginBottom: theme.spacing[6],
  transition: 'all 0.2s ease-in-out'
};

export const formHeaderStyle = {
  fontSize: theme.typography.fontSize['2xl'],   // text-2xl (24px)
  fontWeight: theme.typography.fontWeight.semibold, // font-semibold (600)
  color: theme.colors.gray[900],
  margin: 0,
  marginBottom: theme.spacing[6],
  lineHeight: 1.3                             // leading-snug
};

// Button groups
export const buttonGroupStyle = {
  display: 'flex',
  gap: theme.spacing[3],                       // space-x-3 (12px)
  alignItems: 'center',
  flexWrap: 'wrap'
};

// Navigation
export const navStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing[8],
  padding: theme.spacing[4],
  backgroundColor: theme.colors.background.default,
  borderBottom: `1px solid ${theme.colors.gray[200]}`,
  position: 'sticky',
  top: 0,
  zIndex: 50,
  backdropFilter: 'blur(10px)'
};

// Project card styles
export const projectCardStyle = {
  backgroundColor: theme.colors.background.default,
  border: `1px solid ${theme.colors.gray[300]}`,
  borderRadius: theme.borderRadius['2xl'],      // rounded-2xl (16px)
  padding: theme.spacing[6],                   // p-6 (24px)
  boxShadow: theme.shadows.sm,
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  
  ':hover': {
    boxShadow: theme.shadows.md,
    borderColor: theme.colors.gray[400],
    transform: 'translateY(-2px)'
  }
};

// Message/Alert styles
export const messageStyle = {
  padding: theme.spacing[4],
  borderRadius: theme.borderRadius.xl,          // rounded-xl (12px)
  marginBottom: theme.spacing[6],
  fontSize: theme.typography.fontSize.sm,
  fontWeight: theme.typography.fontWeight.medium,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
};

export const successMessageStyle = {
  ...messageStyle,
  backgroundColor: theme.colors.success[50],
  color: theme.colors.success[600],
  border: `1px solid ${theme.colors.success[600]}`
};

export const errorMessageStyle = {
  ...messageStyle,
  backgroundColor: theme.colors.error[50],
  color: theme.colors.error[600],
  border: `1px solid ${theme.colors.error[600]}`
};

// Map interface styles
export const mapContainerStyle = {
  border: `1px solid ${theme.colors.gray[300]}`,
  borderRadius: theme.borderRadius['2xl'],      // rounded-2xl (16px)
  overflow: 'hidden',
  boxShadow: theme.shadows.md,
  backgroundColor: theme.colors.background.default
};

export const mapControlsStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing[4],
  backgroundColor: theme.colors.background.default,
  borderBottom: `1px solid ${theme.colors.gray[200]}`
};

// Typography helpers
export const heading1Style = {
  fontSize: theme.typography.fontSize['3xl'],   // text-3xl (30px)
  fontWeight: theme.typography.fontWeight.bold, // font-bold (700)
  color: theme.colors.gray[900],
  margin: 0,
  marginBottom: theme.spacing[6],
  lineHeight: 1.25                             // leading-tight
};

export const heading2Style = {
  fontSize: theme.typography.fontSize['2xl'],   // text-2xl (24px)
  fontWeight: theme.typography.fontWeight.semibold, // font-semibold (600)
  color: theme.colors.gray[900],
  margin: 0,
  marginBottom: theme.spacing[4],
  lineHeight: 1.3                             // leading-snug
};

export const heading3Style = {
  fontSize: theme.typography.fontSize.xl,      // text-xl (20px)
  fontWeight: theme.typography.fontWeight.semibold, // font-semibold (600)
  color: theme.colors.gray[900],
  margin: 0,
  marginBottom: theme.spacing[3],
  lineHeight: 1.3                             // leading-snug
};

export const bodyTextStyle = {
  fontSize: theme.typography.fontSize.base,    // text-base (16px)
  color: theme.colors.gray[700],               // Secondary Text
  lineHeight: 1.625,                          // leading-relaxed
  margin: 0,
  marginBottom: theme.spacing[4]
};

export const captionTextStyle = {
  fontSize: theme.typography.fontSize.sm,     // text-sm (14px)
  color: theme.colors.gray[600],              // Caption Text
  lineHeight: 1.625,                         // leading-relaxed
  margin: 0
};

// Utility styles
export const flexBetweenStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
};

export const flexCenterStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export const flexColumnStyle = {
  display: 'flex',
  flexDirection: 'column'
};

// Responsive utilities
export const hideOnMobile = {
  display: 'none',
  '@media (min-width: 768px)': {
    display: 'block'
  }
};

export const showOnMobile = {
  display: 'block',
  '@media (min-width: 768px)': {
    display: 'none'
  }
};