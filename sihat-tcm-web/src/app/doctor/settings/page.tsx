"use client";

import { useEffect } from "react";
import { useAuth } from "@/stores/useAppStore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DoctorSettings } from "@/components/doctor/DoctorSettings";

export default function DoctorSettingsPage() {
    const { profile, loading } = useAuth();
    const router = useRouter();

    const shouldRedirect = !loading && (!profile || profile.role !== "doctor");

    useEffect(() => {
        if (shouldRedirect) {
            router.push("/doctor");
        }
    }, [shouldRedirect, router]);

    if (loading || shouldRedirect) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-8 w-8 text-amber-600" />
            </div>
        );
    }

    return <DoctorSettings />;
}
