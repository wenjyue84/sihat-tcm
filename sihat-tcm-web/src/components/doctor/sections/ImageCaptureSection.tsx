"use client";

import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/diagnosis/camera-capture";
import { Camera, Trash2 } from "lucide-react";

interface ImageCaptureSectionProps {
    type: "tongue" | "face";
    image: string;
    showCamera: boolean;
    onShowCamera: (show: boolean) => void;
    onCapture: (result: { image?: string }) => void;
    onClear: () => void;
}

export function ImageCaptureSection({
    type,
    image,
    showCamera,
    onShowCamera,
    onCapture,
    onClear,
}: ImageCaptureSectionProps) {
    const label = type === "tongue" ? "Tongue" : "Face";

    if (image) {
        return (
            <div className="space-y-4">
                <div className="relative">
                    <img
                        src={image}
                        alt={`${label} capture`}
                        className="w-full max-w-sm mx-auto rounded-lg border"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClear}
                        className="absolute top-2 right-2"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        );
    }

    if (showCamera) {
        return (
            <div className="space-y-4">
                <CameraCapture
                    type={type}
                    onCapture={onCapture}
                    onSkip={() => onShowCamera(false)}
                    initialFacingMode="environment"
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Button
                variant="outline"
                className="w-full h-32 border-dashed"
                onClick={() => onShowCamera(true)}
            >
                <div className="flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 text-slate-400" />
                    <span className="text-slate-600">Capture {label} Image</span>
                </div>
            </Button>
        </div>
    );
}
