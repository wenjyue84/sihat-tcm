"use client";

import { Mic } from "lucide-react";

interface AudioIconProps {
    className?: string;
}

/**
 * Reusable Audio/Microphone icon component
 */
export function AudioIcon({ className }: AudioIconProps) {
    return (
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg ${className || ""}`}>
            <Mic className="w-6 h-6 text-white" />
        </div>
    );
}
