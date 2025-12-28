"use client";

import { useAuth } from "@/stores/useAppStore";
import { useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { DoctorDiagnosisWizard } from "@/components/doctor/DoctorDiagnosisWizard";
import { Loader2 } from "lucide-react";

export default function DoctorDiagnosePage() {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || profile.role !== "doctor")) {
            router.push("/doctor");
        }
    }, [profile, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!profile || profile.role !== "doctor") {
        return null;
    }

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading diagnosis wizard...</p>
                </div>
            </div>
        }>
            <DoctorDiagnosisWizard />
        </Suspense>
    );
}
