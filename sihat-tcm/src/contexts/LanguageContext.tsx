'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { translations, Language, getDefaultLanguage, TranslationKeys, languageNames } from '@/lib/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: TranslationKeys;
    languageNames: typeof languageNames;
    isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'sihat-tcm-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize language from localStorage or browser settings
    useEffect(() => {
        const savedLanguage = localStorage.getItem(STORAGE_KEY) as Language | null;

        if (savedLanguage && ['en', 'zh', 'ms'].includes(savedLanguage)) {
            setLanguageState(savedLanguage);
        } else {
            // Use browser default language
            const browserLanguage = getDefaultLanguage();
            setLanguageState(browserLanguage);
            localStorage.setItem(STORAGE_KEY, browserLanguage);
        }

        setIsLoaded(true);
    }, []);

    // Update language and save to localStorage
    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(STORAGE_KEY, lang);

        // Update document lang attribute for accessibility
        if (typeof document !== 'undefined') {
            document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang === 'ms' ? 'ms-MY' : 'en';
        }
    }, []);

    // Get current translations
    const t = translations[language];

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, languageNames, isLoaded }}>
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
