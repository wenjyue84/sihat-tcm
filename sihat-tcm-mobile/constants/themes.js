// Theme definitions for light and dark mode
// This file contains all color tokens organized by theme

// Base brand colors (shared across themes)
export const BRAND = {
    emerald: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
        950: '#022c22',
    },
    amber: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
    },
    blue: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
    },
};

// Dark theme (current default - dark background with light text)
export const DARK_THEME = {
    // Mode identifier
    mode: 'dark',

    // Background colors
    background: {
        primary: '#022c22',      // Main app background
        secondary: '#064e3b',   // Cards, elevated surfaces
        tertiary: '#0f766e',    // Subtle highlights
        overlay: 'rgba(0, 0, 0, 0.5)',
    },

    // Surface colors (cards, modals, etc.)
    surface: {
        default: 'rgba(255, 255, 255, 0.08)',
        elevated: 'rgba(255, 255, 255, 0.12)',
        pressed: 'rgba(255, 255, 255, 0.16)',
    },

    // Text colors
    text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
        tertiary: 'rgba(255, 255, 255, 0.5)',
        inverse: '#022c22',
    },

    // Border colors
    border: {
        default: 'rgba(255, 255, 255, 0.1)',
        subtle: 'rgba(255, 255, 255, 0.05)',
        accent: 'rgba(255, 255, 255, 0.2)',
    },

    // Brand accent colors
    accent: {
        primary: '#10b981',     // Emerald (main brand)
        secondary: '#fbbf24',   // Amber (secondary brand)
        tertiary: '#3b82f6',    // Blue (info)
    },

    // Semantic colors
    semantic: {
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
    },

    // Gradient presets
    gradients: {
        primary: ['#022c22', '#064e3b', '#000000'],
        accent: ['#fbbf24', '#d97706'],
        success: ['#10b981', '#059669'],
        doctor: ['#0f172a', '#1e293b', '#000000'],
    },

    // Glass effect colors
    glass: {
        background: 'rgba(255, 255, 255, 0.1)',
        border: 'rgba(255, 255, 255, 0.2)',
    },

    // Input colors
    input: {
        background: 'rgba(0, 0, 0, 0.2)',
        border: 'transparent',
        borderFocused: '#fbbf24',
        placeholder: 'rgba(255, 255, 255, 0.5)',
    },

    // Status bar style
    statusBar: 'light',
};

// Light theme (light background with dark text)
export const LIGHT_THEME = {
    // Mode identifier
    mode: 'light',

    // Background colors
    background: {
        primary: '#f8fafc',     // Main app background
        secondary: '#ffffff',   // Cards, elevated surfaces
        tertiary: '#f1f5f9',    // Subtle highlights
        overlay: 'rgba(0, 0, 0, 0.3)',
    },

    // Surface colors (cards, modals, etc.)
    surface: {
        default: '#ffffff',
        elevated: '#ffffff',
        pressed: '#f1f5f9',
    },

    // Text colors
    text: {
        primary: '#0f172a',
        secondary: '#475569',
        tertiary: '#94a3b8',
        inverse: '#ffffff',
    },

    // Border colors
    border: {
        default: '#e2e8f0',
        subtle: '#f1f5f9',
        accent: '#cbd5e1',
    },

    // Brand accent colors
    accent: {
        primary: '#059669',     // Slightly darker emerald for visibility
        secondary: '#d97706',   // Slightly darker amber for visibility
        tertiary: '#2563eb',    // Blue (info)
    },

    // Semantic colors
    semantic: {
        success: '#16a34a',
        warning: '#d97706',
        error: '#dc2626',
        info: '#2563eb',
    },

    // Gradient presets
    gradients: {
        primary: ['#f8fafc', '#e2e8f0', '#f8fafc'],
        accent: ['#fbbf24', '#f59e0b'],
        success: ['#10b981', '#059669'],
        doctor: ['#f8fafc', '#e2e8f0', '#f8fafc'],
    },

    // Glass effect colors
    glass: {
        background: 'rgba(255, 255, 255, 0.8)',
        border: 'rgba(0, 0, 0, 0.1)',
    },

    // Input colors
    input: {
        background: '#f1f5f9',
        border: '#e2e8f0',
        borderFocused: '#059669',
        placeholder: '#94a3b8',
    },

    // Status bar style
    statusBar: 'dark',
};

// Legacy COLORS export for backward compatibility
// Maps to dark theme values by default
export const COLORS = {
    emeraldDeep: DARK_THEME.background.primary,
    emeraldDark: DARK_THEME.background.secondary,
    emeraldMedium: DARK_THEME.accent.primary,
    amberStart: BRAND.amber[400],
    amberEnd: BRAND.amber[600],
    white: '#ffffff',
    glassBorder: DARK_THEME.glass.border,
    glassBg: DARK_THEME.glass.background,
    textSecondary: DARK_THEME.text.secondary,
    inputBg: DARK_THEME.input.background,
};

// Helper to get theme by name
export const getTheme = (mode) => {
    return mode === 'light' ? LIGHT_THEME : DARK_THEME;
};

// Default theme
export const DEFAULT_THEME = DARK_THEME;
