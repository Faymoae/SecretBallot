/**
 * Design Tokens for SecretBallot
 * Generated using deterministic randomization based on project metadata
 * Seed: SecretBallot + sepolia + 202510 + SecretBallot.sol
 * Selected Design System: Glassmorphism
 */

export const designTokens = {
  // Design System
  designSystem: "Glassmorphism",
  
  // Colors - Light Mode
  colors: {
    light: {
      primary: {
        main: "#6366F1",      // Indigo-500
        hover: "#4F46E5",     // Indigo-600
        light: "#A5B4FC",     // Indigo-300
        dark: "#4338CA",      // Indigo-700
      },
      secondary: {
        main: "#8B5CF6",      // Violet-500
        hover: "#7C3AED",     // Violet-600
        light: "#C4B5FD",     // Violet-300
        dark: "#6D28D9",      // Violet-700
      },
      accent: {
        main: "#EC4899",      // Pink-500
        hover: "#DB2777",     // Pink-600
        light: "#F9A8D4",     // Pink-300
        dark: "#BE185D",      // Pink-700
      },
      success: "#10B981",     // Emerald-500
      warning: "#F59E0B",     // Amber-500
      error: "#EF4444",       // Red-500
      info: "#3B82F6",        // Blue-500
      background: {
        primary: "#FFFFFF",
        secondary: "#F9FAFB",  // Gray-50
        tertiary: "#F3F4F6",   // Gray-100
        glass: "rgba(255, 255, 255, 0.7)",
      },
      text: {
        primary: "#111827",    // Gray-900
        secondary: "#6B7280",  // Gray-500
        tertiary: "#9CA3AF",   // Gray-400
        inverse: "#FFFFFF",
      },
      border: {
        light: "#E5E7EB",      // Gray-200
        medium: "#D1D5DB",     // Gray-300
        dark: "#9CA3AF",       // Gray-400
      },
    },
    dark: {
      primary: {
        main: "#818CF8",       // Indigo-400
        hover: "#A5B4FC",      // Indigo-300
        light: "#C7D2FE",      // Indigo-200
        dark: "#6366F1",       // Indigo-500
      },
      secondary: {
        main: "#A78BFA",       // Violet-400
        hover: "#C4B5FD",      // Violet-300
        light: "#DDD6FE",      // Violet-200
        dark: "#8B5CF6",       // Violet-500
      },
      accent: {
        main: "#F472B6",       // Pink-400
        hover: "#F9A8D4",      // Pink-300
        light: "#FBCFE8",      // Pink-200
        dark: "#EC4899",       // Pink-500
      },
      success: "#34D399",      // Emerald-400
      warning: "#FBBF24",      // Amber-400
      error: "#F87171",        // Red-400
      info: "#60A5FA",         // Blue-400
      background: {
        primary: "#0F172A",    // Slate-900
        secondary: "#1E293B",  // Slate-800
        tertiary: "#334155",   // Slate-700
        glass: "rgba(15, 23, 42, 0.7)",
      },
      text: {
        primary: "#F1F5F9",    // Slate-100
        secondary: "#CBD5E1",  // Slate-300
        tertiary: "#94A3B8",   // Slate-400
        inverse: "#0F172A",    // Slate-900
      },
      border: {
        light: "#334155",      // Slate-700
        medium: "#475569",     // Slate-600
        dark: "#64748B",       // Slate-500
      },
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: "system-ui, -apple-system, sans-serif",
      mono: "ui-monospace, monospace",
    },
    fontSize: {
      xs: "0.75rem",      // 12px
      sm: "0.875rem",     // 14px
      base: "1rem",       // 16px
      lg: "1.125rem",     // 18px
      xl: "1.25rem",      // 20px
      "2xl": "1.5rem",    // 24px
      "3xl": "1.875rem",  // 30px
      "4xl": "2.25rem",   // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing
  spacing: {
    compact: {
      xs: "0.25rem",    // 4px
      sm: "0.5rem",     // 8px
      md: "0.75rem",    // 12px
      lg: "1rem",       // 16px
      xl: "1.5rem",     // 24px
      "2xl": "2rem",    // 32px
    },
    comfortable: {
      xs: "0.5rem",     // 8px
      sm: "0.75rem",    // 12px
      md: "1rem",       // 16px
      lg: "1.5rem",     // 24px
      xl: "2rem",       // 32px
      "2xl": "3rem",    // 48px
    },
  },
  
  // Border Radius
  borderRadius: {
    none: "0",
    sm: "0.25rem",      // 4px
    md: "0.5rem",       // 8px
    lg: "0.75rem",      // 12px
    xl: "1rem",         // 16px
    "2xl": "1.5rem",    // 24px
    full: "9999px",
  },
  
  // Shadows - Glassmorphism specific
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    glass: "0 8px 32px 0 rgba(99, 102, 241, 0.15)",
    glassHover: "0 8px 32px 0 rgba(99, 102, 241, 0.25)",
  },
  
  // Backdrop Blur
  backdropBlur: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "24px",
  },
  
  // Transitions
  transitions: {
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
  },
  
  // Breakpoints
  breakpoints: {
    mobile: "0px",
    tablet: "768px",
    desktop: "1024px",
  },
  
  // Z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

export type DesignTokens = typeof designTokens;


