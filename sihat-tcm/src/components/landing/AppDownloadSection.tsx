'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { Smartphone } from 'lucide-react';

export function AppDownloadSection() {
    const { t } = useLanguage();

    return (
        <section id="app-download-section" className="w-full bg-emerald-950 border-t border-emerald-900 overflow-hidden">
            <div className="container mx-auto px-4 py-8 md:py-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">

                    {/* Text Area */}
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-900 text-emerald-100">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-white">
                                {t.appDownload.title}
                            </h2>
                            <p className="text-sm text-emerald-300/80 mt-1 max-w-lg">
                                {t.appDownload.subtitle}
                            </p>
                        </div>
                    </div>

                    {/* Buttons Area */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0 justify-center md:justify-end">
                        <Link href="/mobile-app">
                            <button className="flex items-center gap-2 bg-white text-emerald-950 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors shadow-sm min-w-[130px] justify-center h-10">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.84 3.67-.84 1.54 0 2.72.63 3.45 1.77-3.11 1.66-2.57 6.47.66 7.97-.53 1.65-1.33 3.26-2.86 5.33zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.39-2.11 4.21-3.74 4.25z" />
                                </svg>
                                <div className="flex flex-col items-start leading-none gap-0.5">
                                    <span className="text-[8px] uppercase tracking-wider opacity-60">Download on</span>
                                    <span className="text-xs font-bold">App Store</span>
                                </div>
                            </button>
                        </Link>

                        <Link href="/mobile-app">
                            <button className="flex items-center gap-2 bg-transparent border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors min-w-[130px] justify-center h-10">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3,20.5V3.5C3,2.91,3.34,2.39,3.84,2.15L13.2,12L3.84,21.85C3.34,21.6,3,21.09,3,20.5M14.63,12L4.8,1.64c0.61-0.25,1.26-0.25,1.88,0l12.87,7.15C19.86,9.15,20,9.58,20,10s-0.14,0.85-0.45,1.21l-12.87,7.15c-0.61,0.25-1.26,0.25-1.88,0L14.63,12Z" />
                                </svg>
                                <div className="flex flex-col items-start leading-none gap-0.5">
                                    <span className="text-[8px] uppercase tracking-wider opacity-60">Get it on</span>
                                    <span className="text-xs font-bold">Google Play</span>
                                </div>
                            </button>
                        </Link>

                        {/* Direct APK Download */}
                        <Link href="/mobile-app">
                            <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm min-w-[130px] justify-center h-10 border border-emerald-500">
                                <div className="flex flex-col items-start leading-none gap-0.5">
                                    <span className="text-[8px] uppercase tracking-wider opacity-80">{t.appDownload.directDownload || 'Direct Download'}</span>
                                    <span className="text-xs font-bold">{t.appDownload.downloadApk || 'Download APK'}</span>
                                </div>
                            </button>
                        </Link>
                    </div>

                </div>
            </div>
            {/* Background Texture - Subtle */}
            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
        </section>
    );
}
