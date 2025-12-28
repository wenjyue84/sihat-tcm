"use client";

import { useAuth } from "@/stores/useAppStore";
import { useRouter } from "next/navigation";
import { Loader2, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DoctorSettingsPage() {
    const { profile, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        );
    }

    if (!profile || profile.role !== "doctor") {
        router.push("/doctor");
        return null;
    }

    return (
        <div className="p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-blue-600" />
                    Settings
                </h1>
                <p className="text-slate-500">Manage account and practice settings</p>
            </header>

            <Card className="bg-white/80 backdrop-blur">
                <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Coming Soon</h3>
                    <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                        Global settings and configuration options will be available here.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
