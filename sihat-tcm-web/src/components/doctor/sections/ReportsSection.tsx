"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Camera, Loader2, Eye, X } from "lucide-react";
import { FileData } from "@/features/doctor/hooks/useDoctorDiagnosis";

interface ReportsSectionProps {
  uploadedReports: FileData[];
  extractingFiles: Set<string>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReport: (index: number) => void;
  onViewReport: (file: FileData) => void;
}

export function ReportsSection({
  uploadedReports,
  extractingFiles,
  onFileChange,
  onRemoveReport,
  onViewReport,
}: ReportsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => pdfInputRef.current?.click()}
          variant="outline"
          className="flex-1 gap-2 h-12 border-dashed"
        >
          <FileText className="w-5 h-5 text-blue-500" />
          <span>Upload PDF Reports</span>
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="flex-1 gap-2 h-12 border-dashed"
        >
          <Camera className="w-5 h-5 text-emerald-500" />
          <span>Upload Image Reports</span>
        </Button>
      </div>

      {uploadedReports.length > 0 && (
        <div className="space-y-2 mt-4">
          <Label className="text-sm font-medium text-slate-700">Uploaded Documents:</Label>
          {uploadedReports.map((file, index) => {
            const fileId = file.name + (file as any).lastModified;
            const isExtracting = extractingFiles.has(fileId);

            return (
              <div
                key={index}
                className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg shadow-sm"
              >
                <div
                  className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => onViewReport(file)}
                >
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${isExtracting ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}
                  >
                    {isExtracting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                      {!isExtracting && <Eye className="w-3 h-3 text-slate-400" />}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {isExtracting
                        ? "Extracting text..."
                        : file.extractedText
                          ? `${file.extractedText.substring(0, 50)}...`
                          : "No text extracted"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveReport(index)}
                  className="text-slate-400 hover:text-red-500 ml-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={onFileChange}
      />
      <input
        type="file"
        ref={pdfInputRef}
        className="hidden"
        accept=".pdf,application/pdf"
        multiple
        onChange={onFileChange}
      />
    </div>
  );
}
