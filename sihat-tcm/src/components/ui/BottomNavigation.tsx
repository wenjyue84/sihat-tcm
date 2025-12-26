'use client';

import { Home, User, LogIn, ChevronLeft, ArrowRight, SkipForward } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/stores/useAppStore';
import { useLanguage } from '@/stores/useAppStore';
import { useDiagnosisProgress } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function BottomNavigation() {
    const pathname = usePathname();
    const { user, profile } = useAuth();
    const { t } = useLanguage();
    const { navigationState } = useDiagnosisProgress();

    // Check if we are in the wizard context (home page)
    const isWizard = pathname === '/';

    // Wizard actions from context
    const { onNext, onBack, onSkip, showNext, showBack, showSkip, hideBottomNav } = navigationState;

    if (hideBottomNav) return null;

    if (!isWizard) {
        // Standard Navigation for non-wizard pages (e.g. Dashboard) or if explicitly requested not to show wizard nav
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-200 md:hidden pb-safe">
                <div className="flex items-center justify-around h-16 px-2">
                    <Link
                        href="/"
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors",
                            pathname === '/' ? "text-emerald-600" : "text-stone-500 hover:text-stone-900"
                        )}
                    >
                        <Home className="w-5 h-5" />
                        <span>{t.nav?.home || 'Home'}</span>
                    </Link>

                    {/* Simplified standard nav: Just Home and Login/Dashboard */}
                    {user ? (
                        <Link
                            href={`/${profile?.role || 'patient'}`}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors",
                                pathname.includes(profile?.role || 'patient') ? "text-emerald-600" : "text-stone-500 hover:text-stone-900"
                            )}
                        >
                            <User className="w-5 h-5" />
                            <span>{t.nav?.dashboard || 'Dashboard'}</span>
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors",
                                pathname === '/login' ? "text-emerald-600" : "text-stone-500 hover:text-stone-900"
                            )}
                        >
                            <LogIn className="w-5 h-5" />
                            <span>{t.nav?.login || 'Login'}</span>
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    // Wizard Navigation: Back, Next, Skip, Login/Signup
    return (

        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-200 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-transform duration-300">
            <div className="max-w-4xl mx-auto grid grid-cols-4 items-center h-16 px-2 gap-1 md:gap-4 md:px-6">

                {/* Back Button */}
                <button
                    onClick={onBack}
                    disabled={!showBack || !onBack}
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors",
                        showBack && onBack ? "text-stone-600 hover:text-emerald-600" : "text-stone-300 cursor-not-allowed"
                    )}
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span>{t.common.back}</span>
                </button>

                {/* Next Button */}
                <button
                    onClick={onNext}
                    disabled={!showNext || !onNext}
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors",
                        showNext && onNext ? "text-emerald-600 hover:text-emerald-700 font-bold" : "text-stone-300 cursor-not-allowed"
                    )}
                >
                    <ArrowRight className="w-5 h-5" />
                    <span>{t.common.next}</span>
                </button>

                {/* Skip Button */}
                <button
                    onClick={onSkip}
                    disabled={!showSkip || !onSkip}
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors",
                        showSkip && onSkip ? "text-amber-600 hover:text-amber-700" : "text-stone-300 cursor-not-allowed"
                    )}
                >
                    <SkipForward className="w-5 h-5" />
                    <span>{t.common.skip}</span>
                </button>

                {/* Login/Signup */}
                {user ? (
                    <Link
                        href={`/${profile?.role || 'patient'}`}
                        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors text-stone-500 hover:text-stone-900"
                    >
                        <User className="w-5 h-5" />
                        <span>{t.nav?.dashboardShort || 'Dash'}</span>
                    </Link>
                ) : (
                    <Link
                        href="/login"
                        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors text-stone-500 hover:text-stone-900"
                    >
                        <LogIn className="w-5 h-5" />
                        <span>{t.nav?.loginShort || 'Login'}</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
