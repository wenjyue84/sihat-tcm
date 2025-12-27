/**
 * Apple Design Tokens
 * 
 * Centralized design tokens following Apple's design language
 */

export const appleTokens = {
  /**
   * Typography tokens
   */
  typography: {
    fontFamily: {
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"SF Pro Display"',
        '"SF Pro Text"',
        'system-ui',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'sans-serif',
      ].join(', '),
    },
    fontSize: {
      display: '48px',
      h1: '34px',
      h2: '28px',
      h3: '22px',
      h4: '20px',
      bodyLarge: '17px',
      body: '15px',
      bodySmall: '13px',
      caption: '11px',
    },
  },

  /**
   * Spacing scale (4px base unit)
   */
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
  },

  /**
   * Border radius
   */
  borderRadius: {
    sm: '8px',
    md: '10px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
  },

  /**
   * Shadow/depth system
   */
  shadows: {
    depth1: '0 1px 2px rgba(0, 0, 0, 0.02)',
    depth2: '0 2px 8px rgba(0, 0, 0, 0.04)',
    depth3: '0 4px 16px rgba(0, 0, 0, 0.08)',
    depth4: '0 8px 24px rgba(0, 0, 0, 0.12)',
  },

  /**
   * Blur levels
   */
  blur: {
    sm: 'blur(10px)',
    md: 'blur(20px)',
    lg: 'blur(40px)',
  },

  /**
   * Motion/easing
   */
  motion: {
    ease: [0.25, 0.1, 0.25, 1],
    spring: {
      damping: 20,
      stiffness: 300,
    },
    duration: {
      instant: 100,
      fast: 200,
      normal: 300,
      slow: 500,
    },
  },
} as const;

