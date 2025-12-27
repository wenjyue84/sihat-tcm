"use client";

import { StoreInitializer } from "@/components/store/StoreInitializer";
import { OnboardingWrapper } from "@/components/onboarding/OnboardingWrapper";
import { DeveloperAssistantWrapper } from "@/components/developer";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <StoreInitializer />
        <OnboardingWrapper>
          {children}
          <DeveloperAssistantWrapper />
        </OnboardingWrapper>
      </LanguageProvider>
    </AuthProvider>
  );
}
