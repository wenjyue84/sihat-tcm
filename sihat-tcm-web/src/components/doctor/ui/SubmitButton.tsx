"use client";

import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface SubmitButtonProps {
    isSubmitting: boolean;
    onClick: () => void;
}

export function SubmitButton({ isSubmitting, onClick }: SubmitButtonProps) {
    return (
        <div className="pt-4 md:pt-6 pb-8 md:pb-12">
            <Button
                onClick={onClick}
                disabled={isSubmitting}
                className="w-full h-12 md:h-14 text-base md:text-lg gap-2 md:gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Report...
                    </>
                ) : (
                    <>
                        <Send className="w-5 h-5" />
                        Generate TCM Report
                    </>
                )}
            </Button>
        </div>
    );
}
