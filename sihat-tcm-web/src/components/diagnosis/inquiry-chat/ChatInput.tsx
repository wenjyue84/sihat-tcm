import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Mic, MicOff } from "lucide-react";
import { useLanguage } from "@/stores/useAppStore";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isRecording: boolean;
  onVoiceToggle: () => void;
  isMaximized: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  isRecording,
  onVoiceToggle,
  isMaximized,
}: ChatInputProps) {
  const { t, language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on input unless loading
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]); // Reduced dependencies

  return (
    <div
      className={`flex gap-2 pt-2 md:pt-2 md:border-t ${
        isMaximized
          ? "fixed bottom-16 md:bottom-2 left-0 right-0 p-4 bg-white z-50 md:relative md:p-0 md:bg-transparent md:z-auto"
          : "fixed bottom-16 left-0 right-0 p-4 bg-white z-50 md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:bg-transparent md:border-t-0 md:z-auto"
      }`}
    >
      <form onSubmit={onSubmit} className="flex-1 flex gap-2 w-full md:max-w-4xl md:mx-auto">
        <Button
          type="button"
          variant={isRecording ? "default" : "outline"}
          size="icon"
          className={`h-12 w-12 shrink-0 transition-all duration-200 ${
            isRecording ? "bg-red-500 hover:bg-red-600 border-red-500 animate-pulse" : ""
          }`}
          onClick={onVoiceToggle}
          title={
            isRecording
              ? language === "zh"
                ? "点击停止录音"
                : language === "ms"
                  ? "Ketik untuk berhenti"
                  : "Click to stop"
              : language === "zh"
                ? "语音输入"
                : language === "ms"
                  ? "Input suara"
                  : "Voice input"
          }
        >
          {isRecording ? (
            <MicOff className="w-5 h-5 text-white" />
          ) : (
            <Mic className="w-5 h-5 text-stone-600" />
          )}
        </Button>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.inquiry.inputPlaceholder}
          className="flex-1 h-12 text-base"
          autoFocus={!isMaximized}
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading || !value?.trim()}
          className="h-12 w-12 shrink-0 p-0"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </form>
    </div>
  );
}
