'use client';

import { useDeveloper } from '@/stores/useAppStore';
import { DeveloperAssistant } from './DeveloperAssistant';

/**
 * Wrapper component that conditionally renders the Developer Assistant
 * Only shows when developer mode is enabled
 */
export function DeveloperAssistantWrapper() {
    const { isDeveloperMode } = useDeveloper();

    if (!isDeveloperMode) {
        return null;
    }

    return <DeveloperAssistant />;
}
