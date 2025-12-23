'use client'

import { DoctorProvider } from "@/contexts/DoctorContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DeveloperProvider } from "@/contexts/DeveloperContext";
import { DiagnosisProgressProvider } from "@/contexts/DiagnosisProgressContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { OnboardingWrapper } from "@/components/onboarding/OnboardingWrapper";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <OnboardingProvider>
                <OnboardingWrapper>
                    <AuthProvider>
                        <DoctorProvider>
                            <DeveloperProvider>
                                <DiagnosisProgressProvider>
                                    {children}
                                </DiagnosisProgressProvider>
                            </DeveloperProvider>
                        </DoctorProvider>
                    </AuthProvider>
                </OnboardingWrapper>
            </OnboardingProvider>
        </LanguageProvider>
    );
}
