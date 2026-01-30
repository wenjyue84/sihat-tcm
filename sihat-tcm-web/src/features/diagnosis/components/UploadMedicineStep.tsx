"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Pill, ArrowRight, SkipForward, History, Loader2 } from "lucide-react";
import { useLanguage } from "@/stores/useAppStore";
import { useDiagnosisProgress } from "@/stores/useAppStore";
import { useAuth } from "@/stores/useAppStore";
import { getLastMedicines, getPatientHistory } from "@/lib/actions";
import { DiagnosisSession } from "@/types/database";
import { toast } from "sonner";
import { format } from "date-fns";
import { TextReviewModal } from "./TextReviewModal";
import { FileData } from "./UploadReportsStep";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface UploadMedicineStepProps {
  onComplete: (files: FileData[]) => void;
  onSkip: () => void;
  initialFiles?: FileData[];
  onBack: () => void;
}

export function UploadMedicineStep({
  onComplete,
  onSkip,
  initialFiles = [],
  onBack,
}: UploadMedicineStepProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { setNavigationState } = useDiagnosisProgress();
  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentReviewFile, setCurrentReviewFile] = useState<File | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historySessions, setHistorySessions] = useState<DiagnosisSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [showValidationPrompt, setShowValidationPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    async function loadPortfolioMedicines() {
      if (files.length > 0) return; // Don't overwrite if already have files

      const result = await getLastMedicines();
      if (result.success && result.data && result.data.length > 0) {
        const portfolioFiles: FileData[] = result.data.map(med => ({
          name: `${t.patientDashboard_v1.healthPortfolio.medicines.title} - ${med}`,
          type: "text/plain",
          data: "",
          extractedText: med,
        }));
        setFiles(portfolioFiles);
      }
    }
    loadPortfolioMedicines();
  }, [user]);

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
      onBack: () => onBackRef.current(),
      onSkip: () => onSkipRef.current(),
      showNext: true,
      canNext: true, // Always allow clicking, we'll validate on click
      showBack: true,
      showSkip: true,
    });
  }, [files, setNavigationState]);

  const validateMedicine = async (text: string) => {
    try {
      const response = await fetch("/api/validate-medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Validation failed", error);
      return { isValid: true }; // Fallback
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      alert(t.errors?.fileTooBig?.replace("{size}", "5") || "File too big (max 5MB)");
      return;
    }

    setCurrentReviewFile(file);
    setIsReviewModalOpen(true);
    e.target.value = ""; // Reset input
  };

  const convertToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleReviewConfirm = async (text: string, file: File) => {
    setIsValidating(true);
    const validation = await validateMedicine(text);
    setIsValidating(false);

    if (!validation.isValid) {
      alert(
        validation.message ||
        (language === "zh" ? "无效的药物信息" : "Invalid medicine information")
      );
      return;
    }

    try {
      const base64 = await convertToBase64(file);
      setFiles((prev) => [
        ...prev,
        {
          name: file.name,
          type: file.type,
          data: base64,
          extractedText: text,
        },
      ]);
    } catch (error) {
      console.error("Error processing file:", error);
    }
  };

  const handleManualAdd = async () => {
    if (!manualInput.trim()) return;

    setIsValidating(true);
    const validation = await validateMedicine(manualInput);
    setIsValidating(false);

    const medicineText = manualInput.trim();
    const newEntry: FileData = {
      name: language === "zh" ? "手动输入" : language === "ms" ? "Input Manual" : "Manual Entry",
      type: "text/plain",
      data: "",
      extractedText: medicineText,
    };

    setFiles((prev) => [...prev, newEntry]);
    setManualInput("");
  };

  const handleImportHistory = async () => {
    setIsLoadingHistory(true);
    setIsHistoryModalOpen(true);
    try {
      const result = await getPatientHistory(10);
      if (result.success && result.data) {
        setHistorySessions(result.data);
      } else {
        toast.error(result.error || t.basicInfo.importError || "No previous history found.");
        setIsHistoryModalOpen(false);
      }
    } catch (error) {
      toast.error("Failed to fetch history.");
      setIsHistoryModalOpen(false);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelectSession = (session: DiagnosisSession) => {
    const medicinesArray = session.medicines || [];

    if (medicinesArray.length === 0) {
      toast.error("No medicines found in this session.");
      return;
    }

    const newEntries: FileData[] = medicinesArray.map((med) => ({
      name: `${t.common?.history || "History"} - ${med}`,
      type: "text/plain",
      data: "",
      extractedText: med,
    }));

    // Filter out duplicates
    const existingTexts = files.map((f) => f.extractedText);
    const uniqueKeys = new Set(existingTexts);

    const filteredNewEntries = newEntries.filter((entry) => !uniqueKeys.has(entry.extractedText));

    if (filteredNewEntries.length === 0) {
      toast.info("All medicines from this session are already added.");
    } else {
      setFiles((prev) => [...prev, ...filteredNewEntries]);
      toast.success(t.basicInfo.importSuccessMedicines || "Medicines imported successfully!");
    }

    setIsHistoryModalOpen(false);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const lang = language as "en" | "zh" | "ms";

  const content = {
    title: {
      en: "Upload Current Medicine",
      zh: "上传现有药物",
      ms: "Muat Naik Ubat Semasa",
    },
    description: {
      en: "If you are currently taking any medication (Western or TCM), please upload photos of the packaging or prescriptions. This helps the AI doctor understand your current treatment.",
      zh: "如果您目前正在服用任何药物（西药或中药），请上传包装或处方的照片。这有助于AI医生了解您目前的治疗情况。",
      ms: "Jika anda sedang mengambil sebarang ubat (Barat atau TCM), sila muat naik foto pembungkusan atau preskripsi. Ini membantu doktor AI memahami rawatan semasa anda.",
    },
    uploadBtn: {
      en: "Upload Medicine Photo",
      zh: "上传药物照片",
      ms: "Muat Naik Foto Ubat",
    },
    manualInputLabel: {
      en: "Or enter medicine names manually:",
      zh: "或手动输入药物名称：",
      ms: "Atau masukkan nama ubat secara manual:",
    },
    manualInputPlaceholder: {
      en: "e.g. Panadol, Metformin...",
      zh: "例如：必理痛，二甲双胍...",
      ms: "cth. Panadol, Metformin...",
    },
    addManualBtn: {
      en: "Add",
      zh: "添加",
      ms: "Tambah",
    },
    nextBtn: {
      en: "Start Consultation",
      zh: "开始问诊",
      ms: "Mulakan Konsultasi",
    },
    skipBtn: {
      en: "Skip",
      zh: "跳过",
      ms: "Langkau",
    },
    backBtn: {
      en: "Back",
      zh: "返回",
      ms: "Kembali",
    },
    uploadedFiles: {
      en: "Uploaded Medicine:",
      zh: "已上传药物：",
      ms: "Ubat Dimuat Naik:",
    },
    fileTypes: {
      en: "JPG, PNG, PDF, DOCX, TXT (Max 5MB)",
      zh: "JPG, PNG, PDF, DOCX, TXT (最大 5MB)",
      ms: "JPG, PNG, PDF, DOCX, TXT (Maks 5MB)",
    },
    validationTitle: {
      en: "No Medicine Added",
      zh: "未添加药物",
      ms: "Tiada Ubat Ditambah",
    },
    validationMessage: {
      en: 'Please upload a photo of your medicine or enter medicine name manually, or click "Skip" if you are not taking any medication.',
      zh: '请上传药物照片或手动输入药物名称，如果您目前没有服用任何药物，请点击"跳过"。',
      ms: 'Sila muat naik foto ubat anda atau masukkan nama ubat secara manual, atau klik "Langkau" jika anda tidak mengambil sebarang ubat.',
    },
    uploadNow: {
      en: "Add Medicine",
      zh: "添加药物",
      ms: "Tambah Ubat",
    },
    skipStep: {
      en: "Skip This Step",
      zh: "跳过此步骤",
      ms: "Langkau Langkah Ini",
    },
    importHistoryBtn: {
      en: "Import from History",
      zh: "从历史导入",
      ms: "Import dari Sejarah",
    },
    importing: {
      en: "Importing...",
      zh: "正在导入...",
      ms: "Mengimport...",
    },
  };

  return (
    <Card className="p-6 min-h-[500px] flex flex-col md:mb-0">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-emerald-800 mb-2">{content.title[lang]}</h2>
        <p className="text-stone-600">{content.description[lang]}</p>
      </div>

      <div className="flex flex-col gap-6 mb-6">
        {/* File Upload Area */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-xl bg-stone-50 p-8">
          <div className="text-center w-full">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pill className="w-8 h-8" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 h-10 px-6 gap-2 flex-1 w-full sm:w-auto"
              >
                <Upload className="w-4 h-4" />
                {content.uploadBtn[lang]}
              </Button>

              {user && (
                <Button
                  variant="outline"
                  onClick={handleImportHistory}
                  disabled={isImporting}
                  className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 h-10 px-6 gap-2 flex-1 w-full sm:w-auto"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <History className="w-4 h-4" />
                  )}
                  {isImporting ? content.importing[lang] : content.importHistoryBtn[lang]}
                </Button>
              )}
            </div>

            <p className="text-xs text-stone-400 mt-4">{content.fileTypes[lang]}</p>
          </div>
        </div>

        {/* Manual Input Area */}
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            {content.manualInputLabel[lang]}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={content.manualInputPlaceholder[lang]}
              className="flex-1 h-10 px-3 rounded-md border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
            />
            <Button
              onClick={handleManualAdd}
              disabled={!manualInput.trim()}
              variant="secondary"
              className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
            >
              {content.addManualBtn[lang]}
            </Button>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mb-6 flex-1">
          <h3 className="text-sm font-medium text-stone-700 mb-3">{content.uploadedFiles[lang]}</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white border border-stone-200 p-3 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
                    <Pill className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-stone-900 truncate">
                        {file.extractedText ? file.extractedText.substring(0, 50) : file.name}
                        {file.extractedText && file.extractedText.length > 50 && "..."}
                      </p>
                    </div>
                    <p className="text-xs text-stone-400 truncate">{file.name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-stone-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons - Hidden on mobile as handled by BottomNavigation */}
      <div className="hidden md:flex justify-between gap-3 mt-auto pt-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="text-stone-600 border-stone-300">
            {content.backBtn[lang]}
          </Button>
          <Button variant="ghost" onClick={onSkip} className="text-stone-500 hover:text-stone-700">
            {content.skipBtn[lang]} <SkipForward className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <Button
          onClick={() => onComplete(files)}
          className="bg-emerald-800 hover:bg-emerald-900 flex-1 md:flex-none"
        >
          {content.nextBtn[lang]} <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.txt,.md"
        onChange={handleFileChange}
      />

      <TextReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onConfirm={handleReviewConfirm}
        file={currentReviewFile}
        mode="medicine"
      />

      {/* Validation prompt before skip/next */}
      <Dialog open={showValidationPrompt} onOpenChange={setShowValidationPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.common?.confirm || "Confirm"}</DialogTitle>
            <DialogDescription>
              {t.basicInfo?.medicineSkipWarning ||
                "You haven't added any medicines. Are you currently taking any prescription drugs or supplements?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowValidationPrompt(false)}>
              {t.common?.cancel || "No, let me add"}
            </Button>
            <Button
              onClick={() => {
                setShowValidationPrompt(false);
                onComplete(files);
              }}
            >
              {t.common?.confirm || "Yes, proceed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Selection Dialog */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col p-0 border-none bg-background/95 backdrop-blur-md shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              {t.basicInfo.selectHistoryTitle || "Select from History"}
            </DialogTitle>
            <DialogDescription>
              {t.basicInfo.selectHistoryDesc || "Choose a previous diagnosis to import medicines."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2 pb-6 space-y-3">
            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">
                  {t.common?.loading || "Loading history..."}
                </p>
              </div>
            ) : historySessions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/20">
                <p className="text-muted-foreground">
                  {t.basicInfo.noHistoryFound || "No previous history found."}
                </p>
              </div>
            ) : (
              historySessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className="w-full text-left p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {format(new Date(session.created_at), "PPP")}
                    </span>
                    <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      {session.constitution || "N/A"}
                    </div>
                  </div>
                  <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {session.primary_diagnosis}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {(session.medicines || []).join(", ") ||
                      t.common?.noMedicinesFound ||
                      "No medicines recorded"}
                  </p>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
