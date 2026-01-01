"use client";

import { Save } from "lucide-react";

interface SavedDraftNoticeProps {
    show: boolean;
}

export function SavedDraftNotice({ show }: SavedDraftNoticeProps) {
    if (!show) return null;

    return (
        <div className="max-w-4xl mx-auto px-3 md:px-4 pt-3 md:pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-3 flex items-center gap-2 md:gap-3">
                <Save className="w-4 md:w-5 h-4 md:h-5 text-blue-600 shrink-0" />
                <p className="text-xs md:text-sm text-blue-700">
                    Draft restored. Your work is auto-saved.
                </p>
            </div>
        </div>
    );
}
