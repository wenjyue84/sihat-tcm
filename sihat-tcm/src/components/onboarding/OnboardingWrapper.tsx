'use client';

import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingScreen } from './OnboardingScreen';

interface OnboardingWrapperProps {
    children: React.ReactNode;
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
    const { hasCompletedOnboarding, isLoading } = useOnboarding();

    // Show loading state while checking onboarding status
    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-emerald-900 to-emerald-950">
                <div className="flex flex-col items-center gap-4">
                    {/* Animated Logo/Loader */}
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 animate-spin" />
                    </div>
                    <span className="text-emerald-400 font-medium">Loading...</span>
                </div>
            </div>
        );
    }

    // Show onboarding for first-time users
    if (!hasCompletedOnboarding) {
        return <OnboardingScreen />;
    }

    // Render normal app content
    return <>{children}</>;
}
