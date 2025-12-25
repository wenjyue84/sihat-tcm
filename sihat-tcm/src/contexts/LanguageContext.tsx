'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { translations, Language, getDefaultLanguage, TranslationKeys, languageNames } from '@/lib/translations';
import { useAuth } from './AuthContext';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    syncLanguageFromProfile: (lang: Language) => void;
    t: TranslationKeys;
    languageNames: typeof languageNames;
    isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'sihat-tcm-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { profile, updatePreferences } = useAuth();
    const [language, setLanguageState] = useState<Language>('en');
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize language from profile, localStorage or browser settings
    useEffect(() => {
        // 1. Sync from profile preferences if available
        if (profile?.preferences?.language) {
            setLanguageState(profile.preferences.language as Language);
            localStorage.setItem(STORAGE_KEY, profile.preferences.language);
            setIsLoaded(true);
            return;
        }

        // 2. Fallback to localStorage
        const savedLanguage = localStorage.getItem(STORAGE_KEY) as Language | null;
        if (savedLanguage && ['en', 'zh', 'ms'].includes(savedLanguage)) {
            setLanguageState(savedLanguage);
        } else {
            // 3. Last fallback: browser default language
            const browserLanguage = getDefaultLanguage();
            setLanguageState(browserLanguage);
            localStorage.setItem(STORAGE_KEY, browserLanguage);
        }

        setIsLoaded(true);
    }, [profile]);

    // Update language and save to localStorage/Supabase
    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(STORAGE_KEY, lang);

        // Sync to database if logged in
        if (profile) {
            updatePreferences({ language: lang });
        }

        // Update document lang attribute for accessibility
        if (typeof document !== 'undefined') {
            document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang === 'ms' ? 'ms-MY' : 'en';
        }
    }, [profile, updatePreferences]);

    // Sync language from user profile (after login) - also saves to localStorage
    const syncLanguageFromProfile = useCallback((lang: Language) => {
        if (['en', 'zh', 'ms'].includes(lang)) {
            setLanguageState(lang);
            localStorage.setItem(STORAGE_KEY, lang);

            // Update document lang attribute for accessibility
            if (typeof document !== 'undefined') {
                document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang === 'ms' ? 'ms-MY' : 'en';
            }
        }
    }, []);


    // Get current translations
    const t = translations[language];

    return (
        <LanguageContext.Provider value={{ language, setLanguage, syncLanguageFromProfile, t, languageNames, isLoaded }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Helper hook to get a specific translation section
export function useTranslation<K extends keyof TranslationKeys>(section: K): TranslationKeys[K] {
    const { t } = useLanguage();
    return t[section];
}
