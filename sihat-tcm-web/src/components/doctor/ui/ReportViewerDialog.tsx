"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { FileData } from "@/hooks/useDoctorDiagnosis";

interface ReportViewerDialogProps {
    report: FileData | null;
    onClose: () => void;
}

export function ReportViewerDialog({ report, onClose }: ReportViewerDialogProps) {
    return (
        <Dialog open={!!report} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[80vh] p-4 md:p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-800">
                        <FileText className="w-5 h-5" />
                        {report?.name}
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Extracted Text Content</Label>
                    <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-[50vh] overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                            {report?.extractedText || "No text could be extracted from this document."}
                        </pre>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
