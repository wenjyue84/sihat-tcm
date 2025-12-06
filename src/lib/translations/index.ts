// Translations index file
export { en, type TranslationKeys } from './en';
export { zh } from './zh';
export { ms } from './ms';

import { en } from './en';
import { zh } from './zh';
import { ms } from './ms';

export type Language = 'en' | 'zh' | 'ms';

export const translations = {
    en,
    zh,
    ms,
} as const;

export const languageNames: Record<Language, { native: string; english: string }> = {
    en: { native: 'English', english: 'English' },
    zh: { native: '中文', english: 'Chinese' },
    ms: { native: 'Bahasa Malaysia', english: 'Malay' },
};

// Get the default language based on browser settings
export function getDefaultLanguage(): Language {
    if (typeof navigator === 'undefined') return 'en';

    const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
    const langCode = browserLang.toLowerCase().split('-')[0];

    // Map browser language codes to our supported languages
    if (langCode === 'zh') return 'zh';
    if (langCode === 'ms' || langCode === 'my') return 'ms';

    return 'en';
}

// Get translation for a specific key path
export function getTranslation(translations: typeof en, path: string): string {
    const keys = path.split('.');
    let result: any = translations;

    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            return path; // Return the path if translation not found
        }
    }

    return typeof result === 'string' ? result : path;
}
