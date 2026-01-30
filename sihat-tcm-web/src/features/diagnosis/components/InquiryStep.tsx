"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BasicInfoData } from "./BasicInfoForm";
import { ChevronDown, ChevronUp, Loader2, Send, Upload, X } from "lucide-react";
import { useDoctorLevel } from "@/stores/useAppStore";
import { useLanguage } from "@/stores/useAppStore";
import { ShowPromptButton } from "./ShowPromptButton";
import { INTERACTIVE_CHAT_PROMPT } from "@/lib/systemPrompts";
import { ThinkingAnimation } from "./ThinkingAnimation";
import { TextReviewModal } from "./TextReviewModal";
import type { FileData } from "@/types/diagnosis";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export function InquiryStep({
  onComplete,
  basicInfo,
  onBack,
}: {
  onComplete: (data: { inquiryText: string; chatHistory: any[]; files: FileData[] }) => void;
  basicInfo?: BasicInfoData;
  onBack?: () => void;
}) {
  const { getDoctorInfo } = useDoctorLevel();
  const { t, language } = useLanguage();
  const doctorInfo = getDoctorInfo();
  const [files, setFiles] = useState<FileData[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [localInput, setLocalInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasRequestedInitialQuestion = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial prompts in different languages
  const initialPrompts: Record<string, string> = {
    en: `I am ready for the consultation. Please review my information and start.`,
    zh: `我已经准备好进行问诊。请查看我的信息并开始。`,
    ms: `Saya bersedia untuk konsultasi. Sila semak maklumat saya dan mulakan.`,
  };

  // Construct the initial system message based on basic info
  const systemMessage = basicInfo
    ? `${INTERACTIVE_CHAT_PROMPT}

=== PATIENT DATA ===
Name: ${basicInfo.name}
Age: ${basicInfo.age}
Gender: ${basicInfo.gender}
Weight: ${basicInfo.weight} kg
Height: ${basicInfo.height} cm
Chief Complaint: "${basicInfo.symptoms}"
Duration: ${basicInfo.symptomDuration}
`
    : INTERACTIVE_CHAT_PROMPT;

  // Send message to API with manual streaming
  const sendMessage = useCallback(
    async (userMessage: string, isInitialPrompt = false) => {
      setIsLoading(true);

      // Add user message to state
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: userMessage,
      };

      setMessages((prev) => [...prev, userMsg]);

      const currentMessages = isInitialPrompt
        ? [{ role: "system", content: systemMessage }, userMsg]
        : [...messages, userMsg];

      try {
        console.log("[InquiryStep] Sending message to /api/chat with language:", language);
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: currentMessages.map((m) => ({ role: m.role, content: m.content })),
            basicInfo,
            model: doctorInfo.model,
            language: language, // Pass the selected language
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        // Read streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        // Create placeholder for assistant message
        const assistantMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

        if (reader) {
          console.log("[InquiryStep] Starting to read stream...");
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log("[InquiryStep] Stream complete!");
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;

            // Update assistant message in real-time
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, content: fullText } : m))
            );
          }
        }

        console.log("[InquiryStep] Final response length:", fullText.length);
      } catch (err: any) {
        console.error("[InquiryStep] Error:", err);
        // Add error message in the selected language
        const errorMessages: Record<string, string> = {
          en: "Sorry, I encountered an error. Please try again.",
          zh: "抱歉，发生了错误。请重试。",
          ms: "Maaf, terdapat ralat. Sila cuba lagi.",
        };
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: errorMessages[language] || errorMessages.en,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, systemMessage, basicInfo, doctorInfo.model, language]
  );

  // Trigger the first question from AI doctor when component mounts
  // NOTE: sendMessage is intentionally NOT in the dependency array to prevent duplicate API calls.
  // The hasRequestedInitialQuestion flag ensures this only runs once.
  useEffect(() => {
    if (!hasRequestedInitialQuestion.current && messages.length === 0) {
      hasRequestedInitialQuestion.current = true;

      // Initial prompt in the selected language
      // Uses the component-level initialPrompts constant

      const prompt =
        basicInfo && basicInfo.symptoms
          ? initialPrompts[language] || initialPrompts.en
          : language === "zh"
            ? "请开始询问诊断问题。"
            : language === "ms"
              ? "Sila mulakan soalan diagnosis."
              : "Please start by asking your first diagnostic question.";

      sendMessage(prompt, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, basicInfo, language]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Keep focus on input field
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim() || isLoading) return;
    const userInput = localInput;
    setLocalInput("");
    await sendMessage(userInput);
    inputRef.current?.focus();
  };

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewFile, setReviewFile] = useState<File | null>(null);

  // ... existing code ...

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    // We'll handle the first file for the review modal
    // If multiple files support is needed with review, we'd need a queue system
    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      alert(t.errors.fileTooBig.replace("{size}", "5"));
      return;
    }

    setReviewFile(file);
    setIsReviewModalOpen(true);

    // Reset input so the same file can be selected again if needed
    e.target.value = "";
  };

  const handleReviewConfirm = async (text: string, file: File) => {
    try {
      const base64 = await convertToBase64(file);

      // Add file to visual list
      setFiles((prev) => [
        ...prev,
        {
          name: file.name,
          type: file.type,
          data: base64 as string,
        },
      ]);

      // Send extracted text to AI
      // We send it as a user message so the AI knows about it and it's in history
      const messageContent =
        language === "zh"
          ? `我上传了一份医疗报告 (${file.name})。以下是内容：\n\n${text}`
          : language === "ms"
            ? `Saya telah memuat naik laporan perubatan (${file.name}). Berikut adalah kandungannya:\n\n${text}`
            : `I have uploaded a medical report (${file.name}). Here is the content:\n\n${text}`;

      await sendMessage(messageContent);
    } catch (error) {
      console.error("Error processing file:", error);
    }
  };

  const convertToBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5)
      return {
        category: language === "zh" ? "偏瘦" : language === "ms" ? "Kurang berat" : "Underweight",
        color: "bg-blue-50 border-blue-300 text-blue-800",
      };
    if (bmi < 25)
      return {
        category: language === "zh" ? "正常" : language === "ms" ? "Normal" : "Normal",
        color: "bg-green-50 border-green-300 text-green-800",
      };
    if (bmi < 30)
      return {
        category:
          language === "zh" ? "超重" : language === "ms" ? "Berlebihan berat" : "Overweight",
        color: "bg-yellow-50 border-yellow-300 text-yellow-800",
      };
    return {
      category: language === "zh" ? "肥胖" : language === "ms" ? "Obes" : "Obese",
      color: "bg-red-50 border-red-300 text-red-800",
    };
  };

  const handleComplete = () => {
    const chatSummary = messages
      .filter((m) => m.role !== "system")
      .map(
        (m) =>
          `${m.role === "user" ? (language === "zh" ? "患者" : language === "ms" ? "Pesakit" : "Patient") : language === "zh" ? "医师" : language === "ms" ? "Doktor" : "Doctor"}: ${m.content}`
      )
      .join("\n");

    onComplete({
      inquiryText: chatSummary,
      chatHistory: messages,
      files,
    });
  };

  // Filter messages for display
  const displayMessages = messages.filter(
    (m) =>
      m.role !== "system" &&
      !m.content.startsWith("The patient mentioned") &&
      m.content !== "Please start the consultation." &&
      !Object.values(initialPrompts).includes(m.content) &&
      m.content !== "请开始询问诊断问题。" &&
      m.content !== "Sila mulakan soalan diagnosis." &&
      m.content !== "Please start by asking your first diagnostic question."
  );

  return (
    <Card className="p-4 md:p-6 h-[calc(100vh-220px)] md:h-[calc(100vh-180px)] min-h-[500px] max-h-[800px] flex flex-col gap-3 md:gap-4 mb-20 md:mb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b pb-3 md:pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-semibold text-emerald-800">{t.inquiry.title}</h2>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium border ${doctorInfo.bgColor} ${doctorInfo.borderColor} ${doctorInfo.textColor}`}
            >
              {doctorInfo.icon} {language === "zh" ? doctorInfo.nameZh : doctorInfo.name}
            </span>
          </div>
          <p className="text-stone-600 text-xs md:text-sm">{t.inquiry.chatDescription}</p>
        </div>
        <div className="flex gap-2">
          <ShowPromptButton promptType="chat" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-11 text-sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            {language === "zh"
              ? "上传报告"
              : language === "ms"
                ? "Muat Naik Laporan"
                : "Upload Reports"}
          </Button>
        </div>
      </div>

      {doctorInfo.id === "master" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3 text-sm text-amber-800">
          <span className="text-xl">⏳</span>
          <div>
            <p className="font-medium">
              {language === "zh"
                ? "大师级别分析"
                : language === "ms"
                  ? "Analisis Tahap Pakar"
                  : "Master Level Analysis"}
            </p>
            <p className="text-amber-700/80 text-xs mt-0.5">
              {language === "zh"
                ? "大师级医师会进行深度推理和分析。回复可能需要较长时间，因为需要考虑多种中医理论。"
                : language === "ms"
                  ? "Pakar melakukan penaakulan dan analisis mendalam. Respons mungkin mengambil sedikit masa."
                  : "The Master physician performs deep reasoning and analysis. Responses may take slightly longer to generate."}
            </p>
          </div>
        </div>
      )}

      {/* Basic Information Summary with BMI */}
      {basicInfo && basicInfo.weight && basicInfo.height && (
        <details className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 md:p-4 rounded-lg border border-emerald-200 group">
          <summary className="font-semibold text-emerald-800 text-sm cursor-pointer flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
            {t.report.patientInfo}
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <span className="group-open:hidden">
                {language === "zh"
                  ? "点击展开"
                  : language === "ms"
                    ? "Ketik untuk kembang"
                    : "Tap to expand"}
              </span>
              <span className="hidden group-open:inline">
                {language === "zh"
                  ? "点击收起"
                  : language === "ms"
                    ? "Ketik untuk tutup"
                    : "Tap to collapse"}
              </span>
              <ChevronDown className="w-4 h-4 group-open:hidden" />
              <ChevronUp className="w-4 h-4 hidden group-open:block" />
            </div>
          </summary>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-sm">
            <div>
              <span className="text-stone-500 text-xs">{t.report.name}:</span>
              <p className="font-medium text-stone-800 text-sm">{basicInfo.name}</p>
            </div>
            <div>
              <span className="text-stone-500 text-xs">{t.report.age}:</span>
              <p className="font-medium text-stone-800 text-sm">
                {basicInfo.age} {language === "zh" ? "岁" : language === "ms" ? "tahun" : "years"}
              </p>
            </div>
            <div>
              <span className="text-stone-500 text-xs">{t.report.gender}:</span>
              <p className="font-medium text-stone-800 text-sm capitalize">{basicInfo.gender}</p>
            </div>
            <div>
              <span className="text-stone-500 text-xs">{t.report.weight}:</span>
              <p className="font-medium text-stone-800 text-sm">{basicInfo.weight} kg</p>
            </div>
            <div>
              <span className="text-stone-500 text-xs">{t.report.height}:</span>
              <p className="font-medium text-stone-800 text-sm">{basicInfo.height} cm</p>
            </div>
            <div className="col-span-2 md:col-span-3">
              {(() => {
                const weight = parseFloat(basicInfo.weight);
                const height = parseFloat(basicInfo.height);
                if (weight > 0 && height > 0) {
                  const bmi = calculateBMI(weight, height);
                  const bmiInfo = getBMICategory(bmi);
                  return (
                    <div>
                      <span className="text-stone-500 text-xs">{t.report.bmi}:</span>
                      <div
                        className={`inline-flex items-center gap-2 mt-1 px-2 py-0.5 rounded-full border text-xs ${bmiInfo.color}`}
                      >
                        <span className="font-bold">{bmi.toFixed(1)}</span>
                        <span>•</span>
                        <span className="font-semibold">{bmiInfo.category}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </details>
      )}

      {/* Chat Messages Area */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-stone-100"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#6ee7b7 #f5f5f4",
        }}
      >
        <div className="space-y-4 p-2">
          {displayMessages
            .filter((m) => m.content || m.role === "user")
            .map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[80%] p-3 rounded-lg whitespace-pre-wrap text-sm md:text-base ${
                    m.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-stone-100 text-stone-800 rounded-bl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          {isLoading && displayMessages.length === 0 && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <ThinkingAnimation basicInfo={basicInfo} variant="compact" />
              </div>
            </div>
          )}
          {isLoading &&
            displayMessages.length > 0 &&
            !displayMessages[displayMessages.length - 1]?.content && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <ThinkingAnimation basicInfo={basicInfo} variant="compact" />
                </div>
              </div>
            )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-2 border-t border-stone-100">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-stone-50 px-3 py-1 rounded-full border border-stone-200 text-xs whitespace-nowrap"
            >
              <span className="truncate max-w-[100px]">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="text-stone-400 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t">
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <Input
            ref={inputRef}
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder={t.inquiry.inputPlaceholder}
            className="flex-1 h-12 text-base"
            autoFocus
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !localInput?.trim()}
            className="h-12 w-12 p-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:static md:bg-transparent md:border-none md:shadow-none md:p-0 flex gap-3">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 md:flex-none md:w-auto border-stone-300 text-stone-600 hover:bg-stone-100"
          >
            {t.common.back}
          </Button>
        )}
        <Button
          onClick={handleComplete}
          className="flex-1 h-12 bg-emerald-800 hover:bg-emerald-900 text-base"
          disabled={displayMessages.length < 2}
        >
          {t.inquiry.finishChat}
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
      />

      <TextReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onConfirm={handleReviewConfirm}
        file={reviewFile}
      />
    </Card>
  );
}
