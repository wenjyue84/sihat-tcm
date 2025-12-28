"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Stethoscope } from "lucide-react";

export function DoctorTopBar() {
    const router = useRouter();

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-8 shrink-0">
            <div className="flex items-center gap-3">
                <Button
                    size="sm"
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    onClick={() => router.push("/doctor/diagnose")}
                >
                    <Stethoscope className="w-4 h-4" />
                    New Diagnosis
                </Button>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                    <span className="text-xs font-bold">Dr</span>
                </div>
            </div>
        </header>
    );
}
