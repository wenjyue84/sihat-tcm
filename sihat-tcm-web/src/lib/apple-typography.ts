/**
 * Apple-inspired Typography System
 * 
 * Provides typography utilities that match Apple's design language:
 * - System fonts first (SF Pro on macOS/iOS, Segoe UI on Windows)
 * - Refined type scale with tighter line-heights
 * - Proper font weight hierarchy
 */

export const appleTypography = {
  /**
   * Apple-inspired font stack
   * Prioritizes system fonts for native feel
   */
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
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
    ].join(', '),
    mono: [
      'ui-monospace',
      'SFMono-Regular',
      '"SF Mono"',
      'Menlo',
      'Consolas',
      '"Liberation Mono"',
      'monospace',
    ].join(', '),
  },

  /**
   * Apple-inspired type scale
   * Tighter line-heights for refined appearance
   */
  fontSize: {
    display: {
      size: '48px',
      lineHeight: '1.1', // 56px
      weight: '300', // Ultra-light
      letterSpacing: '-0.01em',
    },
    h1: {
      size: '34px',
      lineHeight: '1.2', // 41px
      weight: '400', // Regular
      letterSpacing: '-0.01em',
    },
    h2: {
      size: '28px',
      lineHeight: '1.2', // 34px
      weight: '400', // Regular
      letterSpacing: '-0.01em',
    },
    h3: {
      size: '22px',
      lineHeight: '1.3', // 29px
      weight: '500', // Medium
      letterSpacing: '-0.01em',
    },
    h4: {
      size: '20px',
      lineHeight: '1.3', // 26px
      weight: '500', // Medium
      letterSpacing: '-0.01em',
    },
    bodyLarge: {
      size: '17px',
      lineHeight: '1.47', // 25px
      weight: '400', // Regular
      letterSpacing: '0',
    },
    body: {
      size: '15px',
      lineHeight: '1.47', // 22px
      weight: '400', // Regular
      letterSpacing: '0',
    },
    bodySmall: {
      size: '13px',
      lineHeight: '1.38', // 18px
      weight: '400', // Regular
      letterSpacing: '0',
    },
    caption: {
      size: '11px',
      lineHeight: '1.18', // 13px
      weight: '400', // Regular
      letterSpacing: '0',
    },
  },

  /**
   * Font weights following Apple's hierarchy
   */
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

/**
 * Typography utility classes for Tailwind
 */
export const appleTypographyClasses = {
  display: 'text-[48px] leading-[1.1] font-light tracking-[-0.01em]',
  h1: 'text-[34px] leading-[1.2] font-normal tracking-[-0.01em]',
  h2: 'text-[28px] leading-[1.2] font-normal tracking-[-0.01em]',
  h3: 'text-[22px] leading-[1.3] font-medium tracking-[-0.01em]',
  h4: 'text-[20px] leading-[1.3] font-medium tracking-[-0.01em]',
  bodyLarge: 'text-[17px] leading-[1.47] font-normal tracking-[0]',
  body: 'text-[15px] leading-[1.47] font-normal tracking-[0]',
  bodySmall: 'text-[13px] leading-[1.38] font-normal tracking-[0]',
  caption: 'text-[11px] leading-[1.18] font-normal tracking-[0]',
} as const;


