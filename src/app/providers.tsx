'use client'

import { DoctorProvider } from "@/contexts/DoctorContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DeveloperProvider } from "@/contexts/DeveloperContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <AuthProvider>
                <DoctorProvider>
                    <DeveloperProvider>
                        {children}
                    </DeveloperProvider>
                </DoctorProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}
