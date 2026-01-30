/**
 * Colors.js - Simplified Color Constants for Mobile App
 * 
 * This file provides a flat export structure for colors following
 * the pattern documented in GEMINI.md. It re-exports values from
 * themes.js for convenience and backward compatibility.
 * 
 * Usage:
 *   import { Colors } from '../constants/Colors';
 *   <View style={{ backgroundColor: Colors.background }} />
 * 
 * For full theme support (light/dark modes), use themes.js directly:
 *   import { DARK_THEME, LIGHT_THEME, getTheme } from '../constants/themes';
 */

import { DARK_THEME, LIGHT_THEME, BRAND } from './themes';

/**
 * Default color palette - uses dark theme values
 * This provides a simple, flat structure for common use cases
 */
export const Colors = {
    // Primary background colors
    background: DARK_THEME.background.primary,         // #022c22 - Deep emerald
    backgroundSecondary: DARK_THEME.background.secondary, // #064e3b - Elevated surfaces
    backgroundTertiary: DARK_THEME.background.tertiary,   // #0f766e - Subtle highlights

    // Text colors
    text: DARK_THEME.text.primary,        // #ffffff
    textSecondary: DARK_THEME.text.secondary, // rgba(255, 255, 255, 0.7)
    textTertiary: DARK_THEME.text.tertiary,   // rgba(255, 255, 255, 0.5)
    textInverse: DARK_THEME.text.inverse,     // #022c22

    // Accent/Brand colors
    accent: DARK_THEME.accent.primary,          // #10b981 - Primary emerald
    accentSecondary: DARK_THEME.accent.secondary, // #fbbf24 - Amber
    accentTertiary: DARK_THEME.accent.tertiary,   // #3b82f6 - Blue

    // Semantic colors
    success: DARK_THEME.semantic.success,   // #22c55e
    warning: DARK_THEME.semantic.warning,   // #f59e0b
    error: DARK_THEME.semantic.error,       // #ef4444
    info: DARK_THEME.semantic.info,         // #3b82f6

    // Border colors
    border: DARK_THEME.border.default,        // rgba(255, 255, 255, 0.1)
    borderSubtle: DARK_THEME.border.subtle,   // rgba(255, 255, 255, 0.05)
    borderAccent: DARK_THEME.border.accent,   // rgba(255, 255, 255, 0.2)

    // Surface/Glass colors
    surface: DARK_THEME.surface.default,      // rgba(255, 255, 255, 0.08)
    surfaceElevated: DARK_THEME.surface.elevated, // rgba(255, 255, 255, 0.12)
    glass: DARK_THEME.glass.background,       // rgba(255, 255, 255, 0.1)
    glassBorder: DARK_THEME.glass.border,     // rgba(255, 255, 255, 0.2)

    // Input colors
    inputBackground: DARK_THEME.input.background,       // rgba(0, 0, 0, 0.2)
    inputBorder: DARK_THEME.input.border,               // transparent
    inputBorderFocused: DARK_THEME.input.borderFocused, // #fbbf24
    inputPlaceholder: DARK_THEME.input.placeholder,     // rgba(255, 255, 255, 0.5)

    // Overlay
    overlay: DARK_THEME.background.overlay, // rgba(0, 0, 0, 0.5)

    // Brand palette (full emerald spectrum)
    emerald50: BRAND.emerald[50],
    emerald100: BRAND.emerald[100],
    emerald200: BRAND.emerald[200],
    emerald300: BRAND.emerald[300],
    emerald400: BRAND.emerald[400],
    emerald500: BRAND.emerald[500],
    emerald600: BRAND.emerald[600],
    emerald700: BRAND.emerald[700],
    emerald800: BRAND.emerald[800],
    emerald900: BRAND.emerald[900],

    // Amber spectrum
    amber50: BRAND.amber[50],
    amber100: BRAND.amber[100],
    amber200: BRAND.amber[200],
    amber300: BRAND.amber[300],
    amber400: BRAND.amber[400],
    amber500: BRAND.amber[500],
    amber600: BRAND.amber[600],

    // Common utility colors
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
};

/**
 * Helper to get theme-aware colors
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {Object} Theme-specific color object
 */
export const getColors = (isDarkMode = true) => {
    const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

    return {
        background: theme.background.primary,
        backgroundSecondary: theme.background.secondary,
        text: theme.text.primary,
        textSecondary: theme.text.secondary,
        accent: theme.accent.primary,
        accentSecondary: theme.accent.secondary,
        success: theme.semantic.success,
        warning: theme.semantic.warning,
        error: theme.semantic.error,
        info: theme.semantic.info,
        border: theme.border.default,
        surface: theme.surface.default,
        glass: theme.glass.background,
        glassBorder: theme.glass.border,
        inputBackground: theme.input.background,
        inputBorderFocused: theme.input.borderFocused,
        overlay: theme.background.overlay,
    };
};

// Default export for convenience
export default Colors;
