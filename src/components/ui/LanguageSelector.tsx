'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/translations';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

interface LanguageSelectorProps {
    variant?: 'dropdown' | 'buttons' | 'compact';
    className?: string;
    showLabel?: boolean;
}

export function LanguageSelector({
    variant = 'dropdown',
    className = '',
    showLabel = true
}: LanguageSelectorProps) {
    const { language, setLanguage, languageNames, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages: { code: Language; flag: string }[] = [
        { code: 'en', flag: '🇬🇧' },
        { code: 'zh', flag: '🇨🇳' },
        { code: 'ms', flag: '🇲🇾' },
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (variant === 'buttons') {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                {showLabel && (
                    <span className="text-sm text-stone-500 flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        {t.language.title}:
                    </span>
                )}
                <div className="flex rounded-lg overflow-hidden border border-stone-200 bg-white shadow-sm">
                    {languages.map(({ code, flag }) => (
                        <button
                            key={code}
                            onClick={() => setLanguage(code)}
                            className={`
                px-3 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5
                ${language === code
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white text-stone-600 hover:bg-stone-50'}
                ${code !== 'en' ? 'border-l border-stone-200' : ''}
              `}
                        >
                            <span>{flag}</span>
                            <span className="hidden sm:inline">{languageNames[code].native}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className={`relative ${className}`} ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                >
                    <Globe className="w-4 h-4" />
                    <span>{languages.find(l => l.code === language)?.flag}</span>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-stone-200 z-50 overflow-hidden"
                        >
                            {languages.map(({ code, flag }) => (
                                <button
                                    key={code}
                                    onClick={() => {
                                        setLanguage(code);
                                        setIsOpen(false);
                                    }}
                                    className={`
                    w-full px-3 py-2 text-sm text-left flex items-center justify-between
                    ${language === code
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'text-stone-600 hover:bg-stone-50'}
                  `}
                                >
                                    <span className="flex items-center gap-2">
                                        <span>{flag}</span>
                                        <span>{languageNames[code].native}</span>
                                    </span>
                                    {language === code && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Default dropdown variant
    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-stone-200 shadow-sm hover:shadow-md transition-all text-stone-700"
            >
                <Globe className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:flex items-center gap-1 text-sm font-medium">
                    {languages.find(l => l.code === language)?.flag} {languageNames[language].native}
                </span>
                <svg
                    className={`hidden sm:block w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-200 z-50 overflow-hidden"
                    >
                        <div className="py-1">
                            {languages.map(({ code, flag }) => (
                                <button
                                    key={code}
                                    onClick={() => {
                                        setLanguage(code);
                                        setIsOpen(false);
                                    }}
                                    className={`
                    w-full px-4 py-2.5 text-sm text-left flex items-center justify-between
                    ${language === code
                                            ? 'bg-emerald-50 text-emerald-700 font-medium'
                                            : 'text-stone-600 hover:bg-stone-50'}
                  `}
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="text-lg">{flag}</span>
                                        <span>{languageNames[code].native}</span>
                                    </span>
                                    {language === code && (
                                        <Check className="w-4 h-4 text-emerald-600" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default LanguageSelector;
