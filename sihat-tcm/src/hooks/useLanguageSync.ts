'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/stores/useAppStore';
import { useLanguage } from '@/stores/useAppStore';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/clientLogger';

/**
 * Hook that syncs language preference between user profile and local state.
 * 
 * Flow:
 * 1. If user has preferred_language in profile → apply it to context
 * 2. If user has NO preferred_language → save current localStorage language to profile
 * 
 * This ensures:
 * - Language selected during onboarding (before login) persists after login
 * - Returning users get their saved language preference applied
 */
export function useLanguageSync() {
    const { user, profile, refreshProfile } = useAuth();
    const { language, syncLanguageFromProfile } = useLanguage();
    const hasSynced = useRef(false);

    useEffect(() => {
        // Only run once per login session
        if (!user || !profile || hasSynced.current) return;

        // If profile has a saved language preference, apply it
        if (profile.preferred_language) {
            syncLanguageFromProfile(profile.preferred_language);
            hasSynced.current = true;
        } else {
            // Profile has no language preference - save current language to profile
            // This captures the language selected during onboarding
            const currentLanguage = language;
            if (currentLanguage && ['en', 'zh', 'ms'].includes(currentLanguage)) {
                supabase
                    .from('profiles')
                    .update({ preferred_language: currentLanguage })
                    .eq('id', user.id)
                    .then(({ error }) => {
                        if (error) {
                            logger.warn('useLanguageSync', 'Failed to save language preference to profile', error);
                        } else {
                            logger.info('useLanguageSync', `Saved language "${currentLanguage}" to profile`);
                            // Refresh profile to get the updated preferred_language
                            refreshProfile();
                        }
                    });
            }
            hasSynced.current = true;
        }
    }, [user, profile, language, syncLanguageFromProfile, refreshProfile]);

    // Reset sync flag when user logs out
    useEffect(() => {
        if (!user) {
            hasSynced.current = false;
        }
    }, [user]);
}
