// Layout System following Apple-Style Design Guidelines
import { theme } from './theme.js';

// Container (Design Guidelines)
export const containerStyle = {
  maxWidth: '1280px',  // Slightly wider for better layout
  width: '100%',
  margin: '0 auto',    // mx-auto
  padding: '1rem',     // Reduced padding
  fontFamily: theme.typography.fontFamily.primary,
  backgroundColor: theme.colors.background.default,
  // Removed minHeight: '100vh' to prevent vertical stretch
  
  // Responsive padding
  '@media (min-width: 640px)': {
    padding: '1.5rem'  // Reduced padding
  },
  '@media (min-width: 1024px)': {
    padding: '2rem'    // Reduced padding
  }
};

// Section spacing (Design Guidelines)
export const sectionStyle = {
  marginBottom: theme.spacing[4], // Reduced from 32px to 16px
};

export const majorSectionStyle = {
  marginBottom: theme.spacing[6], // Reduced from 48px to 24px
};

// Header styles
export const headerStyle = {
  textAlign: 'center',
  marginBottom: theme.spacing[4],  // Reduced from 32px to 16px
  borderBottom: `1px solid ${theme.colors.gray[200]}`,
  paddingBottom: theme.spacing[3]  // Reduced from 24px to 12px
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
  transition: 'all 0.2s ease-in-out',
  width: '100%',                               // Ensure full width
  boxSizing: 'border-box'                      // Include padding in width
};

// Compact form style for tighter spaces
export const compactFormStyle = {
  ...formStyle,
  padding: theme.spacing[4],                   // p-4 (16px) - smaller padding
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
  gap: theme.spacing[2],                       // space-x-2 (8px) - reduced gap
  alignItems: 'center',
  flexWrap: 'wrap',
  width: '100%',                               // Ensure full width
  justifyContent: 'flex-start'                 // Align buttons to start
};

// Responsive button group for mobile
export const responsiveButtonGroupStyle = {
  display: 'flex',
  gap: theme.spacing[2],
  alignItems: 'stretch',
  flexDirection: 'column',                     // Stack on mobile
  width: '100%',
  
  '@media (min-width: 640px)': {
    flexDirection: 'row',                      // Row on larger screens
    alignItems: 'center'
  }
};

// Navigation
export const navStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing[4],  // Reduced from 32px to 16px
  padding: theme.spacing[3],       // Reduced from 16px to 12px
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
  backgroundColor: theme.colors.background.default,
  height: '400px',                              // Reduced from 500px to 400px
  minHeight: '350px',                           // Reduced from 400px to 350px
  width: '100%',                                // Full width
  position: 'relative'                          // For proper map rendering
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

// Container overflow fixes
export const preventOverflowStyle = {
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  overflow: 'hidden'
};

export const scrollableContainerStyle = {
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  overflowX: 'auto',
  overflowY: 'visible'
};

// Button container fixes
export const buttonContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing[2],
  alignItems: 'center',
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box'
};

// Responsive flex container
export const responsiveFlexStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing[3],
  width: '100%',
  
  '@media (min-width: 640px)': {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  }
};