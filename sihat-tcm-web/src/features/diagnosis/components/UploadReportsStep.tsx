"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, FileText, ArrowRight, SkipForward, Eye, Camera, Loader2 } from "lucide-react";
import { useLanguage } from "@/stores/useAppStore";
import { useDiagnosisProgress } from "@/stores/useAppStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getMedicalReports } from "@/lib/actions";
import type { FileData } from "@/types/diagnosis";

// Re-export for backwards compatibility
export type { FileData };

interface UploadReportsStepProps {
  onComplete: (files: FileData[]) => void;
  onSkip: () => void;
  initialFiles?: FileData[];
  onBack?: () => void;
}

export function UploadReportsStep({
  onComplete,
  onSkip,
  initialFiles = [],
  onBack,
}: UploadReportsStepProps) {
  const { t, language } = useLanguage();
  const { setNavigationState } = useDiagnosisProgress();
  const [files, setFiles] = useState<FileData[]>(initialFiles);

  const [viewingFile, setViewingFile] = useState<FileData | null>(null);
  const [showValidationPrompt, setShowValidationPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Sync with global navigation
  const onCompleteRef = useRef(onComplete);
  const onSkipRef = useRef(onSkip);
  const onBackRef = useRef(onBack);
  const filesRef = useRef(files);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onSkipRef.current = onSkip;
    onBackRef.current = onBack;
    filesRef.current = files;
  }, [onComplete, onSkip, onBack, files]);

  // Load from Basic Profile on mount
  useEffect(() => {
    async function loadPortfolioReports() {
      if (files.length > 0) return; // Don't overwrite if already have files

      const result = await getMedicalReports();
      if (result.success && result.data && result.data.length > 0) {
        const portfolioFiles: FileData[] = result.data.map(report => ({
          name: report.name,
          type: report.type || 'application/pdf',
          data: report.file_url || '', // We don't have base64, but we have the URL
          extractedText: report.extracted_text || ''
        }));
        setFiles(portfolioFiles);
      }
    }
    loadPortfolioReports();
  }, []);

  // Handle next with validation
  const handleNext = () => {
    if (filesRef.current.length === 0) {
      setShowValidationPrompt(true);
      return;
    }
    onCompleteRef.current(filesRef.current);
  };

  useEffect(() => {
    setNavigationState({
      onNext: handleNext,
      onBack: onBack ? () => onBackRef.current?.() : undefined,
      onSkip: () => onSkipRef.current(),
      showNext: true,
      canNext: true, // Always allow clicking, we'll validate on click
      showBack: !!onBack,
      showSkip: true,
    });
  }, [files, setNavigationState, !!onBack]);



  // Background extraction state
  const [extractingFiles, setExtractingFiles] = useState<Set<string>>(new Set());

  // Background AI text extraction
  const extractTextInBackground = async (file: File) => {
    const fileId = file.name + file.lastModified;
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });

      // Call extraction API
      const response = await fetch("/api/extract-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64,
          fileName: file.name,
          fileType: file.type,
          mode: "general",
          language: language,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update the file with extracted text
      setFiles((prev) =>
        prev.map((f) => {
          // Identify file by name (assuming unique for this session for simplicity, 
          // or we could use the ID we generated)
          if (f.name === file.name) {
            return { ...f, extractedText: data.text || "" };
          }
          return f;
        })
      );
    } catch (error) {
      console.error("Background extraction error:", error);
    } finally {
      // Remove from extracting set
      setExtractingFiles((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    // Reset input
    e.target.value = "";

    for (const file of newFiles) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(t.errors?.fileTooBig?.replace("{size}", "5") || `File ${file.name} too big (max 5MB)`);
        continue;
      }

      try {
        const base64 = await convertToBase64(file);
        const fileId = file.name + file.lastModified;

        // Add file immediately
        setFiles((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            data: base64,
            extractedText: "", // Empty initially
          },
        ]);

        // Start background extraction
        setExtractingFiles((prev) => new Set(prev).add(fileId));
        extractTextInBackground(file);

      } catch (error) {
        console.error("Error processing file:", error);
      }
    }
  };

  const convertToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const lang = language as "en" | "zh" | "ms";

  const content = {
    title: {
      en: "Upload Medical Reports",
      zh: "上传医疗报告",
      ms: "Muat Naik Laporan Perubatan",
    },
    description: {
      en: "If you have any existing medical reports, blood tests, or diagnosis documents, please upload them here. We will extract the text for the AI doctor.",
      zh: "如果您有任何现有的医疗报告、验血报告或诊断文件，请在此上传。我们将为AI医生提取文本。",
      ms: "Jika anda mempunyai sebarang laporan perubatan, ujian darah, atau dokumen diagnosis sedia ada, sila muat naik di sini. Kami akan mengekstrak teks untuk doktor AI.",
    },
    uploadBtn: {
      en: "Upload Document",
      zh: "上传文档",
      ms: "Muat Naik Dokumen",
    },
    nextBtn: {
      en: "Next Step",
      zh: "下一步",
      ms: "Langkah Seterusnya",
    },
    skipBtn: {
      en: "Skip",
      zh: "跳过",
      ms: "Langkau",
    },
    uploadPhotoBtn: {
      en: "Take Photo / Upload Image",
      zh: "拍照 / 上传图片",
      ms: "Ambil Foto / Muat Naik Imej",
    },
    uploadPdfBtn: {
      en: "Upload PDF",
      zh: "上传 PDF",
      ms: "Muat Naik PDF",
    },
    uploadedFiles: {
      en: "Uploaded Files:",
      zh: "已上传文件：",
      ms: "Fail Dimuat Naik:",
    },
    viewExtractedText: {
      en: "Extracted Text",
      zh: "提取的文本",
      ms: "Teks Diekstrak",
    },
    clickToView: {
      en: "Click to view extracted text",
      zh: "点击查看提取的文本",
      ms: "Klik untuk melihat teks",
    },
    noTextExtracted: {
      en: "No text was extracted from this file.",
      zh: "未从此文件中提取到文本。",
      ms: "Tiada teks diekstrak daripada fail ini.",
    },
    extracting: {
      en: "Extracting text...",
      zh: "正在提取文本...",
      ms: "Sedang mengekstrak teks...",
    },
    validationTitle: {
      en: "No Documents Uploaded",
      zh: "未上传文档",
      ms: "Tiada Dokumen Dimuat Naik",
    },
    validationMessage: {
      en: 'Please upload at least one medical report, or click "Skip" if you have no documents to upload.',
      zh: '请上传至少一份医疗报告，如果没有需要上传的文档，请点击"跳过"。',
      ms: 'Sila muat naik sekurang-kurangnya satu laporan perubatan, atau klik "Langkau" jika tiada dokumen.',
    },
    uploadNow: {
      en: "Upload Now",
      zh: "现在上传",
      ms: "Muat Naik Sekarang",
    },
    skipStep: {
      en: "Skip This Step",
      zh: "跳过此步骤",
      ms: "Langkau Langkah Ini",
    },
  };

  return (
    <Card className="p-6 min-h-[500px] flex flex-col md:mb-0">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-emerald-800 mb-2">{content.title[lang]}</h2>
        <p className="text-stone-600">{content.description[lang]}</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-xl bg-stone-50 p-6 mb-6">
        <div className="text-center w-full">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-md mx-auto">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-600 hover:bg-emerald-700 flex-1 gap-2"
            >
              <Camera className="w-4 h-4" />
              {content.uploadPhotoBtn[lang]}
            </Button>
            <Button
              onClick={() => pdfInputRef.current?.click()}
              variant="outline"
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 flex-1 gap-2"
            >
              <FileText className="w-4 h-4" />
              {content.uploadPdfBtn[lang]}
            </Button>
          </div>

          <p className="text-xs text-stone-400 mt-4">PDF, JPG, PNG (Max 5MB)</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-stone-700 mb-3">{content.uploadedFiles[lang]}</h3>
          <div className="space-y-2">
            {files.map((file, index) => {
              // Simple check if this file is extracting (using name as key for simplicity)
              // In production, better to use a unique ID
              const isExtracting = extractingFiles.has(file.name + (file as any).lastModified) || (file.extractedText === "" && file.name.includes("Time")); // Fallback check

              return (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white border border-stone-200 p-3 rounded-lg shadow-sm"
                >
                  <div
                    className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer hover:bg-stone-50 rounded-lg transition-colors p-1 -ml-1"
                    onClick={() => setViewingFile(file)}
                    title={content.clickToView[lang]}
                  >
                    <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${isExtracting ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-500'}`}>
                      {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-emerald-700 truncate hover:underline">
                          {file.name}
                        </p>
                        {!isExtracting && <Eye className="w-3 h-3 text-stone-400" />}
                      </div>
                      <p className="text-xs text-stone-500 truncate">
                        {isExtracting
                          ? content.extracting[lang]
                          : (file.extractedText ? `${file.extractedText.substring(0, 50)}...` : content.noTextExtracted[lang])}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-stone-400 hover:text-red-500 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="hidden md:flex justify-between gap-3 mt-auto pt-4">
        <div className="flex gap-2">
          {onBack && (
            <Button variant="outline" onClick={onBack} className="text-stone-600 border-stone-300">
              {language === "zh" ? "返回" : language === "ms" ? "Kembali" : "Back"}
            </Button>
          )}
          <Button variant="ghost" onClick={onSkip} className="text-stone-500 hover:text-stone-700">
            {content.skipBtn[lang]} <SkipForward className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <Button
          onClick={() => onComplete(files)}
          className="bg-emerald-800 hover:bg-emerald-900 flex-1 md:flex-none"
          disabled={files.length === 0}
        >
          {content.nextBtn[lang]} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={pdfInputRef}
        className="hidden"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleFileChange}
      />

      {/* View Extracted Text Dialog */}
      <Dialog open={!!viewingFile} onOpenChange={(open) => !open && setViewingFile(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800">
              <FileText className="w-5 h-5" />
              {viewingFile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-stone-600 mb-2">{content.viewExtractedText[lang]}</div>
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 max-h-[50vh] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-stone-700 font-mono">
              {viewingFile?.extractedText || content.noTextExtracted[lang]}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation Prompt Dialog */}
      <Dialog open={showValidationPrompt} onOpenChange={setShowValidationPrompt}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Upload className="w-5 h-5" />
              {content.validationTitle[lang]}
            </DialogTitle>
            <DialogDescription className="text-stone-600 pt-2">
              {content.validationMessage[lang]}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowValidationPrompt(false);
                onSkip();
              }}
              className="text-stone-600 border-stone-300"
            >
              {content.skipStep[lang]}
            </Button>
            <Button
              onClick={() => {
                setShowValidationPrompt(false);
                fileInputRef.current?.click();
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {content.uploadNow[lang]}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
