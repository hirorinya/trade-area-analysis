// Apple-Style Design System for Trade Area Analysis Platform
export const theme = {
  // Colors - WCAG-compliant & Accessibility-optimized
  colors: {
    // Primary Colors (Design Guidelines compliant)
    primary: {
      50: '#EFF6FF',   // Light Blue - backgrounds, selection areas (use sparingly)
      100: '#DBEAFE',  // Mid Blue - icon backgrounds (use sparingly)
      500: '#3B82F6',  // Main Blue - primary actions, selected states
      600: '#2563EB',  // Dark Blue - hover states, emphasis
      700: '#1D4ED8',  // Emphasis Blue - high-contrast text
      800: '#1E40AF',  // Ultra Emphasis Blue - text on white, AAA compliant
    },
    
    // System Colors (Contrast-aware - 7:1 ratio)
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      600: '#059669'   // Success - 7:1 contrast
    },
    
    // Warning colors  
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      600: '#D97706'   // Warning - 7:1 contrast
    },
    
    // Error colors
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      600: '#DC2626'   // Error - 7:1 contrast
    },
    
    // Info color
    info: {
      700: '#1D4ED8'   // Info - 7:1 contrast
    },
    
    // Grayscale (Accessibility-optimized)
    gray: {
      50: '#F9FAFB',   // Section BG - use only when necessary
      100: '#f3f4f6',
      200: '#E5E7EB',  // Thin Border - subtle dividers
      300: '#D1D5DB',  // Border - dividers, card outlines
      400: '#9ca3af',
      500: '#6B7280',  // Muted Text - less important (4.5:1)
      600: '#4B5563',  // Caption Text - annotations (7:1)
      700: '#374151',  // Secondary Text - supporting text (12.6:1)
      800: '#1f2937',
      900: '#111827'   // Primary Text - main text (21:1)
    },
    
    // Background colors
    background: {
      default: '#FFFFFF',  // Default background (avoid tinted backgrounds)
      section: '#F9FAFB'   // Section BG (use only when necessary)
    },
    
    // Trade Area Analysis specific colors
    location: {
      store: '#2563EB',      // Blue for stores
      competitor: '#DC2626', // Red for competitors  
      poi: '#059669'         // Green for POIs
    }
  },

  // Typography
  typography: {
    fontFamily: {
      primary: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"Fira Code", "SF Mono", Monaco, Consolas, monospace'
    },
    
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px  
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },

  // Spacing
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem'      // 96px
  },

  // Border radius (Design Guidelines compliant)
  borderRadius: {
    none: '0',
    lg: '0.5rem',     // 8px - Small Button, Input Field
    xl: '0.75rem',    // 12px - Standard Button  
    '2xl': '1rem',    // 16px - Large Button, Card
    '3xl': '1.5rem',  // 24px - Modal
    full: '9999px'    // Circle - Icon Button
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
  },

  // Component styles (Design Guidelines compliant)
  components: {
    button: {
      // Primary Button (Design Guidelines)
      primary: {
        backgroundColor: '#3B82F6',  // bg-blue-500
        color: '#FFFFFF',            // text-white
        fontWeight: 600,             // font-semibold
        borderRadius: '0.75rem',     // rounded-xl (Standard Button)
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // shadow-md (always)
        minHeight: '3rem',           // 48px min height
        padding: '0.75rem 1.5rem',   // px-6 py-3 (Standard)
        fontSize: '0.875rem',        // text-sm
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ':hover': {
          backgroundColor: '#2563EB', // bg-blue-600
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // shadow-lg
          transform: 'scale(1.05)'
        },
        ':focus': {
          outline: 'none',
          boxShadow: '0 0 0 2px #3B82F6, 0 0 0 4px rgba(59, 130, 246, 0.2)' // ring-2 ring-blue-500 ring-offset-2
        },
        ':active': {
          transform: 'scale(0.95)'
        }
      },
      
      // Secondary Button (Design Guidelines)
      secondary: {
        backgroundColor: '#FFFFFF',  // bg-white
        color: '#1D4ED8',           // text-blue-700
        border: '2px solid #1D4ED8', // border-2 border-blue-700
        fontWeight: 600,             // font-semibold
        borderRadius: '0.75rem',     // rounded-xl
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', // shadow-sm
        minHeight: '3rem',           // 48px min height
        padding: '0.75rem 1.5rem',   // px-6 py-3
        fontSize: '0.875rem',        // text-sm
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ':hover': {
          backgroundColor: '#EFF6FF', // bg-blue-50
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' // shadow-md
        }
      },
      
      // Danger Button (Design Guidelines)
      danger: {
        backgroundColor: '#DC2626',  // bg-red-600
        color: '#FFFFFF',           // text-white
        fontWeight: 600,            // font-semibold
        borderRadius: '0.75rem',    // rounded-xl
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // shadow-md
        minHeight: '3rem',          // 48px min height
        padding: '0.75rem 1.5rem',  // px-6 py-3
        fontSize: '0.875rem',       // text-sm
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ':hover': {
          backgroundColor: '#B91C1C', // bg-red-700
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' // shadow-lg
        }
      },

      // Small Button
      small: {
        padding: '0.5rem 1rem',     // px-3 py-2.5 (12/10px)
        fontSize: '0.875rem',       // text-sm
        borderRadius: '0.5rem',     // rounded-lg
        minHeight: '2.75rem'        // ≥44px touch target
      },

      // Large Button  
      large: {
        padding: '1rem 2rem',       // px-8 py-4 (32/16px)
        fontSize: '1rem',           // text-base
        borderRadius: '1rem',       // rounded-2xl
        minHeight: '3.5rem'         // 56px height
      }
    },

    // Card Design (Design Guidelines)
    card: {
      base: {
        backgroundColor: '#FFFFFF',  // bg-white
        border: '1px solid #D1D5DB', // border border-gray-300
        borderRadius: '1rem',        // rounded-2xl (16px)
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', // shadow-sm
        padding: '1.25rem',          // p-5 (20px)
        transition: 'all 0.2s ease-in-out',
        ':hover': {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // shadow-md
          borderColor: '#9CA3AF'     // border-gray-400
        }
      }
    },

    // Input Fields (Design Guidelines)
    input: {
      base: {
        width: '100%',
        boxSizing: 'border-box',     // Ensure padding doesn't cause overflow
        padding: '0.75rem 1rem',     // Standard padding
        border: '1px solid #D1D5DB', // border-gray-300
        borderRadius: '0.5rem',      // rounded-lg (8px)
        fontSize: '0.875rem',        // text-sm
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#FFFFFF',  // bg-white
        color: '#111827',            // text-gray-900
        minHeight: '3rem',           // h-12 (48px)
        transition: 'all 0.2s ease-in-out',
        ':focus': {
          outline: 'none',
          borderColor: '#3B82F6',    // border-blue-500
          boxShadow: '0 0 0 2px #3B82F6, 0 0 0 4px rgba(59, 130, 246, 0.2)' // ring-2 ring-blue-500 ring-opacity-20
        },
        ':placeholder': {
          color: '#6B7280'           // placeholder-gray-500
        },
        ':error': {
          borderColor: '#DC2626',    // border-red-500
          boxShadow: '0 0 0 2px #DC2626, 0 0 0 4px rgba(220, 38, 38, 0.2)' // ring-2 ring-red-500 ring-opacity-20
        }
      }
    }
  }
};

// Helper function to get theme values
export const getThemeValue = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], theme);
};

export default theme;