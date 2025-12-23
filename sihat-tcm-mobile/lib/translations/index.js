/**
 * Translations Index - Mobile i18n Infrastructure
 * 
 * Provides language detection, translation utilities, and exports
 * for the Sihat TCM mobile app.
 */

import { getLocales } from 'expo-localization';
import { en } from './en';
import { zh } from './zh';
import { ms } from './ms';

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'zh', 'ms'];

// All translations
export const translations = {
    en,
    zh,
    ms,
};

// Language display names with flags
export const languageNames = {
    en: { native: 'English', english: 'English', flag: '🇺🇸' },
    zh: { native: '中文', english: 'Chinese', flag: '🇨🇳' },
    ms: { native: 'Bahasa Malaysia', english: 'Malay', flag: '🇲🇾' },
};

/**
 * Get the default language based on device settings
 * Falls back to English if device language is not supported
 */
export function getDefaultLanguage() {
    try {
        const locales = getLocales();
        if (!locales || locales.length === 0) return 'en';

        const langCode = locales[0]?.languageCode?.toLowerCase();

        // Map device language codes to our supported languages
        if (langCode === 'zh' || langCode === 'zh-hans' || langCode === 'zh-hant') {
            return 'zh';
        }
        if (langCode === 'ms' || langCode === 'my') {
            return 'ms';
        }

        return 'en';
    } catch (error) {
        console.warn('Error detecting device language:', error);
        return 'en';
    }
}

/**
 * Get a translation value by dot-notation path
 * @param {object} translationObj - The translation object to search
 * @param {string} path - Dot-notation path (e.g., 'common.save')
 * @returns {string} The translated string or the path if not found
 */
export function getTranslation(translationObj, path) {
    if (!path || !translationObj) return path;

    const keys = path.split('.');
    let result = translationObj;

    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            return path; // Return the path if translation not found
        }
    }

    return typeof result === 'string' ? result : path;
}

/**
 * Replace template variables in a translation string
 * @param {string} str - The translation string with {variable} placeholders
 * @param {object} variables - Object containing variable values
 * @returns {string} The string with variables replaced
 */
export function interpolate(str, variables = {}) {
    if (!str || typeof str !== 'string') return str;

    return str.replace(/\{(\w+)\}/g, (match, key) => {
        return variables.hasOwnProperty(key) ? variables[key] : match;
    });
}

// Re-export individual translation objects
export { en } from './en';
export { zh } from './zh';
export { ms } from './ms';
