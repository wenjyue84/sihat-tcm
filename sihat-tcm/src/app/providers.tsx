'use client'

import { StoreInitializer } from '@/components/store/StoreInitializer'
import { OnboardingWrapper } from '@/components/onboarding/OnboardingWrapper'
import { DeveloperAssistantWrapper } from '@/components/developer'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <>
            <StoreInitializer />
            <OnboardingWrapper>
                {children}
                <DeveloperAssistantWrapper />
            </OnboardingWrapper>
        </>
    )
}

