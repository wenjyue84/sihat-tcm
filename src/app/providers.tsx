'use client'

import { DoctorProvider } from "@/contexts/DoctorContext";
import { AuthProvider } from "@/contexts/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <DoctorProvider>
                {children}
            </DoctorProvider>
        </AuthProvider>
    );
}
