'use client'

import { DoctorProvider } from "@/contexts/DoctorContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DeveloperProvider } from "@/contexts/DeveloperContext";
import { DiagnosisProgressProvider } from "@/contexts/DiagnosisProgressContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { OnboardingWrapper } from "@/components/onboarding/OnboardingWrapper";
import { DeveloperAssistantWrapper } from "@/components/developer";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <LanguageProvider>
                <OnboardingProvider>
                    <OnboardingWrapper>
                        <DoctorProvider>
                            <DeveloperProvider>
                                <DiagnosisProgressProvider>
                                    {children}
                                    <DeveloperAssistantWrapper />
                                </DiagnosisProgressProvider>
                            </DeveloperProvider>
                        </DoctorProvider>
                    </OnboardingWrapper>
                </OnboardingProvider>
            </LanguageProvider>
        </AuthProvider>
    );
}

