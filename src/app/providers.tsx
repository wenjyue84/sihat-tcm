'use client'

import { DoctorProvider } from "@/contexts/DoctorContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <AuthProvider>
                <DoctorProvider>
                    {children}
                </DoctorProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}
