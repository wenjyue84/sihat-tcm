import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_THEME, LIGHT_THEME, getTheme } from '../constants/themes';

// Storage key for persisting theme preference
const THEME_STORAGE_KEY = '@sihat_tcm_theme_mode';

// Create the context
const ThemeContext = createContext({
    theme: DARK_THEME,
    mode: 'dark',
    isDark: true,
    toggleTheme: () => { },
    setThemeMode: () => { },
});

// Theme Provider component
export function ThemeProvider({ children }) {
    // Get system color scheme as default
    const systemColorScheme = useColorScheme();

    // State for current theme mode: 'system' | 'light' | 'dark'
    const [themePreference, setThemePreference] = useState('dark');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved theme preference on mount
    useEffect(() => {
        loadThemePreference();
    }, []);

    // Listen for system theme changes when in 'system' mode
    useEffect(() => {
        if (themePreference === 'system') {
            const subscription = Appearance.addChangeListener(({ colorScheme }) => {
                // This will trigger a re-render with new system theme
            });
            return () => subscription?.remove();
        }
    }, [themePreference]);

    const loadThemePreference = async () => {
        try {
            const savedPreference = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedPreference) {
                setThemePreference(savedPreference);
            }
        } catch (error) {
            console.error('Error loading theme preference:', error);
        } finally {
            setIsLoaded(true);
        }
    };

    const saveThemePreference = async (preference) => {
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    // Calculate the actual mode based on preference
    const actualMode = useMemo(() => {
        if (themePreference === 'system') {
            return systemColorScheme || 'dark';
        }
        return themePreference;
    }, [themePreference, systemColorScheme]);

    // Get the theme object based on mode
    const theme = useMemo(() => {
        return getTheme(actualMode);
    }, [actualMode]);

    // Toggle between light and dark (skips system)
    const toggleTheme = () => {
        const newMode = actualMode === 'dark' ? 'light' : 'dark';
        setThemePreference(newMode);
        saveThemePreference(newMode);
    };

    // Set specific theme mode
    const setThemeMode = (mode) => {
        if (['system', 'light', 'dark'].includes(mode)) {
            setThemePreference(mode);
            saveThemePreference(mode);
        }
    };

    const contextValue = useMemo(() => ({
        theme,
        mode: actualMode,
        preference: themePreference,
        isDark: actualMode === 'dark',
        isLight: actualMode === 'light',
        toggleTheme,
        setThemeMode,
        isLoaded,
    }), [theme, actualMode, themePreference, isLoaded]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}

// Hook to use theme in components
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Hook to get just the theme object (for style sheets)
export function useThemeColors() {
    const { theme } = useTheme();
    return theme;
}

export default ThemeContext;
