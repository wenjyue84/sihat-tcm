/**
 * Language Context for Sihat TCM Mobile
 * 
 * Provides i18n support with:
 * - Device language auto-detection
 * - AsyncStorage persistence
 * - Easy-to-use useLanguage hook
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    translations,
    languageNames,
    getDefaultLanguage,
    SUPPORTED_LANGUAGES,
} from '../lib/translations';

// Storage key for persisting language preference
const LANGUAGE_STORAGE_KEY = '@sihat_tcm_language';

// Create the context with default values
const LanguageContext = createContext({
    language: 'en',
    setLanguage: () => { },
    t: translations.en,
    languageNames,
    isLoaded: false,
});

/**
 * Language Provider Component
 * Wraps the app to provide language context to all children
 */
export function LanguageProvider({ children }) {
    const [language, setLanguageState] = useState('en');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved language preference on mount
    useEffect(() => {
        loadLanguagePreference();
    }, []);

    /**
     * Load language from AsyncStorage or detect from device
     */
    const loadLanguagePreference = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

            if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
                setLanguageState(savedLanguage);
            } else {
                // Use device language as default
                const deviceLanguage = getDefaultLanguage();
                setLanguageState(deviceLanguage);
                // Save the detected language
                await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, deviceLanguage);
            }
        } catch (error) {
            console.error('Error loading language preference:', error);
            // Fallback to English
            setLanguageState('en');
        } finally {
            setIsLoaded(true);
        }
    };

    /**
     * Save language preference to AsyncStorage
     */
    const saveLanguagePreference = async (lang) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        } catch (error) {
            console.error('Error saving language preference:', error);
        }
    };

    /**
     * Set the current language
     * @param {string} lang - Language code ('en', 'zh', 'ms')
     */
    const setLanguage = useCallback((lang) => {
        if (SUPPORTED_LANGUAGES.includes(lang)) {
            setLanguageState(lang);
            saveLanguagePreference(lang);
        } else {
            console.warn(`Unsupported language: ${lang}. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
        }
    }, []);

    // Get current translations
    const t = useMemo(() => {
        return translations[language] || translations.en;
    }, [language]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        language,
        setLanguage,
        t,
        languageNames,
        isLoaded,
        // Helper to check if current language matches
        isLanguage: (lang) => language === lang,
        // Helper to get language display name
        getLanguageName: (lang, format = 'native') => {
            const names = languageNames[lang];
            return names ? names[format] : lang;
        },
    }), [language, setLanguage, t, isLoaded]);

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
}

/**
 * Hook to access language context
 * @returns {Object} Language context with translations and utilities
 */
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

/**
 * Hook to get just the translation object
 * Useful for style sheets or when you only need translations
 * @returns {Object} Current translation object
 */
export function useTranslations() {
    const { t } = useLanguage();
    return t;
}

/**
 * Hook to get a specific translation section
 * @param {string} section - The section key (e.g., 'common', 'login')
 * @returns {Object} The translation section
 */
export function useTranslationSection(section) {
    const { t } = useLanguage();
    return t[section] || {};
}

export default LanguageContext;
