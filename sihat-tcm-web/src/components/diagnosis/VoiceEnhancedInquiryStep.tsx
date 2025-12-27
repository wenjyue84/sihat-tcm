/**
 * VoiceEnhancedInquiryStep - Inquiry step with voice-to-text integration
 *
 * This component enhances the inquiry step with:
 * - Voice-to-text for symptom description
 * - Voice commands for navigation
 * - Accessibility improvements
 */

"use client";

import React, { useState, useEffect } from "react";
import { InquiryWizard } from "./InquiryWizard";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useVoiceCommandContext } from "@/components/ui/VoiceCommandProvider";
import { useLanguage } from "@/stores/useAppStore";
import { useAccessibilityContext } from "@/stores/useAppStore";
import { VoiceCommand } from "@/lib/voiceCommandHandler";
import { Mic, MessageSquare, HelpCircle } from "lucide-react";

interface VoiceEnhancedInquiryStepProps {
  onComplete: (result: any) => void;
  onBack?: () => void;
  initialData?: any;
}

export function VoiceEnhancedInquiryStep({
  onComplete,
  onBack,
  initialData,
}: VoiceEnhancedInquiryStepProps) {
  const { registerCommand, unregisterCommand, speak } = useVoiceCommandContext();
  const { announce } = useAccessibilityContext();
  const { t, language } = useLanguage();

  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [voiceSymptoms, setVoiceSymptoms] = useState("");
  const [isUsingVoice, setIsUsingVoice] = useState(false);

  // Register inquiry-specific voice commands
  useEffect(() => {
    const inquiryCommands: VoiceCommand[] = [
      {
        command: "start_symptom_dictation",
        patterns: getInquiryCommandPatterns("dictate", language),
        action: () => {
          setShowVoiceInput(true);
          setIsUsingVoice(true);
          speak(getInquiryFeedback("dictation_started", language));
        },
        description: getInquiryCommandDescription("dictate", language),
        category: "input",
        enabled: true,
      },
      {
        command: "stop_symptom_dictation",
        patterns: getInquiryCommandPatterns("stop_dictate", language),
        action: () => {
          setIsUsingVoice(false);
          speak(getInquiryFeedback("dictation_stopped", language));
        },
        description: getInquiryCommandDescription("stop_dictate", language),
        category: "input",
        enabled: true,
      },
      {
        command: "inquiry_help",
        patterns: getInquiryCommandPatterns("help", language),
        action: () => {
          const helpMessage = getInquiryHelpMessage(language);
          speak(helpMessage);
        },
        description: getInquiryCommandDescription("help", language),
        category: "accessibility",
        enabled: true,
      },
      {
        command: "clear_symptoms",
        patterns: getInquiryCommandPatterns("clear", language),
        action: () => {
          setVoiceSymptoms("");
          speak(getInquiryFeedback("cleared", language));
        },
        description: getInquiryCommandDescription("clear", language),
        category: "input",
        enabled: true,
      },
    ];

    // Register commands
    inquiryCommands.forEach((command) => {
      registerCommand(command);
    });

    // Provide initial voice instructions
    const welcomeMessage = getInquiryWelcomeMessage(language);
    setTimeout(() => {
      speak(welcomeMessage);
    }, 1000);

    // Cleanup
    return () => {
      inquiryCommands.forEach((command) => {
        unregisterCommand(command.command);
      });
    };
  }, [registerCommand, unregisterCommand, speak, language]);

  // Handle voice input result
  const handleVoiceResult = (text: string) => {
    setVoiceSymptoms(text);
    announce(`Voice input received: ${text}`, "polite");
  };

  // Handle voice input start
  const handleVoiceStart = () => {
    setIsUsingVoice(true);
    announce("Voice input started for symptom description", "assertive");
  };

  // Handle voice input stop
  const handleVoiceStop = () => {
    setIsUsingVoice(false);
    announce("Voice input stopped", "polite");
  };

  // Enhanced completion handler
  const handleComplete = (result: any) => {
    // Include voice symptoms in the result if available
    const enhancedResult = {
      ...result,
      voiceSymptoms: voiceSymptoms || null,
    };

    const completionMessage = getInquiryCompletionMessage(language);
    speak(completionMessage);
    onComplete(enhancedResult);
  };

  // Enhanced back handler
  const handleBack = () => {
    if (onBack) {
      const backMessage = getInquiryBackMessage(language);
      speak(backMessage);
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      {/* Voice Input Card */}
      {showVoiceInput && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {getVoiceInputTitle(language)}
              </h3>
              <p className="text-sm text-gray-600">{getVoiceInputDescription(language)}</p>
            </div>
          </div>

          <VoiceInput
            value={voiceSymptoms}
            onChange={setVoiceSymptoms}
            onVoiceStart={handleVoiceStart}
            onVoiceStop={handleVoiceStop}
            onVoiceResult={handleVoiceResult}
            placeholder={getVoiceInputPlaceholder(language)}
            multiline={true}
            rows={4}
            language={language}
            aria-label="Voice input for symptom description"
            className="mb-4"
          />

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <HelpCircle className="w-4 h-4" />
            <span>{getVoiceInputTip(language)}</span>
          </div>
        </Card>
      )}

      {/* Voice Input Toggle */}
      {!showVoiceInput && (
        <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-800">{getVoiceToggleTitle(language)}</p>
                <p className="text-sm text-gray-600">{getVoiceToggleDescription(language)}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowVoiceInput(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Mic className="w-4 h-4 mr-2" />
              {getVoiceToggleButton(language)}
            </Button>
          </div>
        </Card>
      )}

      {/* Original Inquiry Wizard */}
      <InquiryWizard
        onComplete={handleComplete}
        onBack={handleBack}
        initialData={{
          ...initialData,
          voiceSymptoms: voiceSymptoms || undefined,
        }}
      />

      {/* Voice Status Indicator */}
      {isUsingVoice && (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-80">
          <Card className="p-3 bg-blue-600 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Mic className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{getVoiceStatusTitle(language)}</p>
                <p className="text-xs opacity-90">{getVoiceStatusDescription(language)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Get inquiry command patterns for different languages
 */
function getInquiryCommandPatterns(action: string, language: string): string[] {
  const patterns: Record<string, Record<string, string[]>> = {
    en: {
      dictate: ["dictate symptoms", "voice input", "speak symptoms", "describe symptoms"],
      stop_dictate: ["stop dictation", "stop voice input", "finish speaking"],
      help: ["inquiry help", "symptom help", "how to describe", "voice help"],
      clear: ["clear symptoms", "clear input", "start over", "reset"],
    },
    zh: {
      dictate: ["口述症状", "语音输入", "说出症状", "描述症状"],
      stop_dictate: ["停止口述", "停止语音输入", "完成说话"],
      help: ["问诊帮助", "症状帮助", "如何描述", "语音帮助"],
      clear: ["清除症状", "清除输入", "重新开始", "重置"],
    },
    ms: {
      dictate: ["sebut gejala", "input suara", "cakap gejala", "terangkan gejala"],
      stop_dictate: ["henti sebut", "henti input suara", "selesai cakap"],
      help: ["bantuan soal siasat", "bantuan gejala", "cara terang", "bantuan suara"],
      clear: ["padam gejala", "padam input", "mula semula", "set semula"],
    },
  };

  return patterns[language]?.[action] || patterns.en[action];
}

/**
 * Get inquiry command descriptions
 */
function getInquiryCommandDescription(action: string, language: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    en: {
      dictate: "Start voice input for symptoms",
      stop_dictate: "Stop voice input",
      help: "Get help with symptom description",
      clear: "Clear symptom input",
    },
    zh: {
      dictate: "开始症状语音输入",
      stop_dictate: "停止语音输入",
      help: "获取症状描述帮助",
      clear: "清除症状输入",
    },
    ms: {
      dictate: "Mulakan input suara untuk gejala",
      stop_dictate: "Hentikan input suara",
      help: "Dapatkan bantuan penerangan gejala",
      clear: "Padam input gejala",
    },
  };

  return descriptions[language]?.[action] || descriptions.en[action];
}

/**
 * Get inquiry feedback messages
 */
function getInquiryFeedback(action: string, language: string): string {
  const feedback: Record<string, Record<string, string>> = {
    en: {
      dictation_started: "Voice input started. Please describe your symptoms.",
      dictation_stopped: "Voice input stopped.",
      cleared: "Symptom input cleared.",
    },
    zh: {
      dictation_started: "语音输入已开始。请描述您的症状。",
      dictation_stopped: "语音输入已停止。",
      cleared: "症状输入已清除。",
    },
    ms: {
      dictation_started: "Input suara dimulakan. Sila terangkan gejala anda.",
      dictation_stopped: "Input suara dihentikan.",
      cleared: "Input gejala dipadamkan.",
    },
  };

  return feedback[language]?.[action] || feedback.en[action];
}

/**
 * Get various UI text functions
 */
function getInquiryWelcomeMessage(language: string): string {
  const messages: Record<string, string> = {
    en: "Welcome to the medical inquiry step. You can use voice commands to dictate your symptoms or get help.",
    zh: "欢迎来到医疗问诊步骤。您可以使用语音命令口述症状或获取帮助。",
    ms: "Selamat datang ke langkah soal siasat perubatan. Anda boleh gunakan arahan suara untuk sebut gejala atau dapatkan bantuan.",
  };
  return messages[language] || messages.en;
}

function getInquiryHelpMessage(language: string): string {
  const messages: Record<string, string> = {
    en: "Describe your symptoms in detail, including when they started, how severe they are, and what makes them better or worse.",
    zh: "详细描述您的症状，包括何时开始、严重程度以及什么会使症状好转或恶化。",
    ms: "Terangkan gejala anda dengan terperinci, termasuk bila bermula, tahap keterukan, dan apa yang membuatkan lebih baik atau buruk.",
  };
  return messages[language] || messages.en;
}

function getVoiceInputTitle(language: string): string {
  const titles: Record<string, string> = {
    en: "Voice Symptom Description",
    zh: "语音症状描述",
    ms: "Penerangan Gejala Suara",
  };
  return titles[language] || titles.en;
}

function getVoiceInputDescription(language: string): string {
  const descriptions: Record<string, string> = {
    en: "Speak naturally to describe your symptoms",
    zh: "自然地说话来描述您的症状",
    ms: "Bercakap secara semula jadi untuk menerangkan gejala anda",
  };
  return descriptions[language] || descriptions.en;
}

function getVoiceInputPlaceholder(language: string): string {
  const placeholders: Record<string, string> = {
    en: "Click the microphone and describe your symptoms...",
    zh: "点击麦克风并描述您的症状...",
    ms: "Klik mikrofon dan terangkan gejala anda...",
  };
  return placeholders[language] || placeholders.en;
}

function getVoiceInputTip(language: string): string {
  const tips: Record<string, string> = {
    en: "Speak clearly and include details about duration, severity, and triggers",
    zh: "说话清晰，包括持续时间、严重程度和触发因素的详细信息",
    ms: "Bercakap dengan jelas dan sertakan butiran tentang tempoh, keterukan, dan pencetus",
  };
  return tips[language] || tips.en;
}

function getVoiceToggleTitle(language: string): string {
  const titles: Record<string, string> = {
    en: "Use Voice Input",
    zh: "使用语音输入",
    ms: "Gunakan Input Suara",
  };
  return titles[language] || titles.en;
}

function getVoiceToggleDescription(language: string): string {
  const descriptions: Record<string, string> = {
    en: "Describe your symptoms using voice instead of typing",
    zh: "使用语音而不是打字来描述您的症状",
    ms: "Terangkan gejala anda menggunakan suara daripada menaip",
  };
  return descriptions[language] || descriptions.en;
}

function getVoiceToggleButton(language: string): string {
  const buttons: Record<string, string> = {
    en: "Start Voice Input",
    zh: "开始语音输入",
    ms: "Mula Input Suara",
  };
  return buttons[language] || buttons.en;
}

function getVoiceStatusTitle(language: string): string {
  const titles: Record<string, string> = {
    en: "Voice Input Active",
    zh: "语音输入激活",
    ms: "Input Suara Aktif",
  };
  return titles[language] || titles.en;
}

function getVoiceStatusDescription(language: string): string {
  const descriptions: Record<string, string> = {
    en: "Listening for your symptom description",
    zh: "正在听取您的症状描述",
    ms: "Mendengar penerangan gejala anda",
  };
  return descriptions[language] || descriptions.en;
}

function getInquiryCompletionMessage(language: string): string {
  const messages: Record<string, string> = {
    en: "Medical inquiry completed. Moving to examination steps.",
    zh: "医疗问诊完成。进入检查步骤。",
    ms: "Soal siasat perubatan selesai. Beralih ke langkah pemeriksaan.",
  };
  return messages[language] || messages.en;
}

function getInquiryBackMessage(language: string): string {
  const messages: Record<string, string> = {
    en: "Going back to basic information.",
    zh: "返回基本信息。",
    ms: "Kembali ke maklumat asas.",
  };
  return messages[language] || messages.en;
}
