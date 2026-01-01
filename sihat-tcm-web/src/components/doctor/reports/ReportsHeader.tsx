"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReportsHeaderProps {
    title?: string;
    subtitle?: string;
}

/**
 * Header component for the reports page with back button and title
 */
export function ReportsHeader({
    title = "Medical Reports",
    subtitle = "View and manage patient diagnosis histories",
}: ReportsHeaderProps): JSX.Element {
    const router = useRouter();

    return (
        <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="md:hidden"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-lg md:text-xl font-bold text-slate-800">{title}</h1>
                    <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">{subtitle}</p>
                </div>
            </div>
        </header>
    );
}
