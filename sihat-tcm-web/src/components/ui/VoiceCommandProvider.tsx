/**
 * VoiceCommandProvider - React component for voice command integration
 *
 * This provider:
 * - Integrates voice commands with the diagnosis wizard
 * - Provides voice feedback for accessibility
 * - Manages voice command state across components
 * - Handles language switching for voice features
 */

"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  useVoiceCommand,
  useVoiceDictation,
  UseVoiceCommandOptions,
} from "@/hooks/useVoiceCommand";
import { useLanguage } from "@/stores/useAppStore";
import { useAccessibilityContext } from "@/stores/useAppStore";
import { VoiceCommand } from "@/lib/voiceCommandHandler";

interface VoiceCommandContextType {
  // Voice command state
  isSupported: boolean;
  isEnabled: boolean;
  isListening: boolean;
  isDictationMode: boolean;
  isSpeaking: boolean;
  error: string | null;

  // Voice command actions
  start: () => void;
  stop: () => void;
  speak: (text: string) => Promise<void>;
  toggle: () => void;

  // Dictation
  startDictation: () => void;
  stopDictation: () => void;
  dictationText: string;
  clearDictation: () => void;

  // Command management
  registerCommand: (command: VoiceCommand) => void;
  unregisterCommand: (commandId: string) => void;

  // Settings
  enableVoiceCommands: (enabled: boolean) => void;
  enableVoiceFeedback: (enabled: boolean) => void;
}

const VoiceCommandContext = createContext<VoiceCommandContextType | undefined>(undefined);

interface VoiceCommandProviderProps {
  children: ReactNode;
  enabled?: boolean;
  enableFeedback?: boolean;
  enableCommands?: boolean;
  enableDictation?: boolean;
  onNavigationCommand?: (action: string) => void;
}

export function VoiceCommandProvider({
  children,
  enabled = true,
  enableFeedback = true,
  enableCommands = true,
  enableDictation = true,
  onNavigationCommand,
}: VoiceCommandProviderProps) {
  const { language } = useLanguage();
  const { isScreenReaderEnabled, announce } = useAccessibilityContext();
  const [voiceEnabled, setVoiceEnabled] = useState(enabled);
  const [feedbackEnabled, setFeedbackEnabled] = useState(enableFeedback);

  // Voice command options based on current language
  const getVoiceOptions = (): UseVoiceCommandOptions => {
    const languageMap: Record<string, string> = {
      en: "en-US",
      zh: "zh-CN",
      ms: "ms-MY",
    };

    return {
      enabled: voiceEnabled,
      language: languageMap[language] || "en-US",
      enableFeedback: feedbackEnabled && isScreenReaderEnabled,
      enableCommands,
      enableDictation,
      debugMode: process.env.NODE_ENV === "development",
    };
  };

  // Main voice command hook
  const [voiceState, voiceActions] = useVoiceCommand(getVoiceOptions());

  // Dictation hook
  const dictation = useVoiceDictation({
    enabled: voiceEnabled && enableDictation,
    language: getVoiceOptions().language,
    onResult: (text) => {
      announce(`Dictated: ${text}`, "polite");
    },
    onError: (error) => {
      console.error("Voice dictation error:", error);
    },
  });

  // Setup navigation commands
  useEffect(() => {
    if (!onNavigationCommand) return;

    const navigationCommands: VoiceCommand[] = [
      {
        command: "navigate_next",
        patterns: getNavigationPatterns("next", language),
        action: () => onNavigationCommand("next"),
        description: getCommandDescription("next", language),
        category: "navigation",
        enabled: true,
      },
      {
        command: "navigate_back",
        patterns: getNavigationPatterns("back", language),
        action: () => onNavigationCommand("back"),
        description: getCommandDescription("back", language),
        category: "navigation",
        enabled: true,
      },
      {
        command: "navigate_skip",
        patterns: getNavigationPatterns("skip", language),
        action: () => onNavigationCommand("skip"),
        description: getCommandDescription("skip", language),
        category: "navigation",
        enabled: true,
      },
    ];

    // Register navigation commands
    navigationCommands.forEach((command) => {
      voiceActions.registerCommand(command);
    });

    // Cleanup
    return () => {
      navigationCommands.forEach((command) => {
        voiceActions.unregisterCommand(command.command);
      });
    };
  }, [language, onNavigationCommand, voiceActions]);

  // Setup accessibility commands
  useEffect(() => {
    const accessibilityCommands: VoiceCommand[] = [
      {
        command: "repeat_instructions",
        patterns: getAccessibilityPatterns("repeat", language),
        action: () => {
          // This would integrate with the current step's instructions
          voiceActions.speak(getCurrentInstructions(language));
        },
        description: getCommandDescription("repeat", language),
        category: "accessibility",
        enabled: true,
      },
      {
        command: "help_commands",
        patterns: getAccessibilityPatterns("help", language),
        action: () => {
          const helpText = getHelpText(language);
          voiceActions.speak(helpText);
        },
        description: getCommandDescription("help", language),
        category: "accessibility",
        enabled: true,
      },
      {
        command: "toggle_voice",
        patterns: getAccessibilityPatterns("toggle", language),
        action: () => {
          setVoiceEnabled(!voiceEnabled);
        },
        description: getCommandDescription("toggle", language),
        category: "accessibility",
        enabled: true,
      },
    ];

    // Register accessibility commands
    accessibilityCommands.forEach((command) => {
      voiceActions.registerCommand(command);
    });

    // Cleanup
    return () => {
      accessibilityCommands.forEach((command) => {
        voiceActions.unregisterCommand(command.command);
      });
    };
  }, [language, voiceEnabled, voiceActions]);

  // Update language when it changes
  useEffect(() => {
    const languageMap: Record<string, string> = {
      en: "en-US",
      zh: "zh-CN",
      ms: "ms-MY",
    };

    voiceActions.setLanguage(languageMap[language] || "en-US");
  }, [language, voiceActions]);

  // Announce voice command availability
  useEffect(() => {
    if (voiceState.isSupported && voiceEnabled) {
      const message = getVoiceAvailabilityMessage(language);
      announce(message, "polite", 2000);
    }
  }, [voiceState.isSupported, voiceEnabled, language, announce]);

  // Context value
  const contextValue: VoiceCommandContextType = {
    // State
    isSupported: voiceState.isSupported,
    isEnabled: voiceEnabled,
    isListening: voiceState.isListening,
    isDictationMode: voiceState.isDictationMode || dictation.isActive,
    isSpeaking: voiceState.isSpeaking,
    error: voiceState.error,

    // Actions
    start: voiceActions.start,
    stop: voiceActions.stop,
    speak: voiceActions.speak,
    toggle: () => setVoiceEnabled(!voiceEnabled),

    // Dictation
    startDictation: dictation.start,
    stopDictation: dictation.stop,
    dictationText: dictation.text,
    clearDictation: dictation.clear,

    // Command management
    registerCommand: voiceActions.registerCommand,
    unregisterCommand: voiceActions.unregisterCommand,

    // Settings
    enableVoiceCommands: setVoiceEnabled,
    enableVoiceFeedback: setFeedbackEnabled,
  };

  return (
    <VoiceCommandContext.Provider value={contextValue}>{children}</VoiceCommandContext.Provider>
  );
}

/**
 * Hook to use voice command context
 */
export function useVoiceCommandContext(): VoiceCommandContextType {
  const context = useContext(VoiceCommandContext);
  if (context === undefined) {
    throw new Error("useVoiceCommandContext must be used within a VoiceCommandProvider");
  }
  return context;
}

/**
 * Get navigation patterns for different languages
 */
function getNavigationPatterns(action: string, language: string): string[] {
  const patterns: Record<string, Record<string, string[]>> = {
    en: {
      next: ["next", "continue", "go forward", "proceed", "next step"],
      back: ["back", "previous", "go back", "return", "previous step"],
      skip: ["skip", "skip this", "skip step", "skip this step"],
    },
    zh: {
      next: ["下一步", "继续", "前进", "下一个"],
      back: ["返回", "上一步", "回去", "后退"],
      skip: ["跳过", "跳过这步", "略过"],
    },
    ms: {
      next: ["seterusnya", "teruskan", "maju", "langkah seterusnya"],
      back: ["kembali", "sebelum", "balik", "langkah sebelum"],
      skip: ["langkau", "langkau ini", "langkau langkah"],
    },
  };

  return patterns[language]?.[action] || patterns.en[action];
}

/**
 * Get accessibility patterns for different languages
 */
function getAccessibilityPatterns(action: string, language: string): string[] {
  const patterns: Record<string, Record<string, string[]>> = {
    en: {
      repeat: ["repeat", "say again", "repeat instructions"],
      help: ["help", "what can I say", "voice commands", "assistance"],
      toggle: ["toggle voice", "voice on off", "disable voice", "enable voice"],
    },
    zh: {
      repeat: ["重复", "再说一遍", "重复指示"],
      help: ["帮助", "我可以说什么", "语音命令", "协助"],
      toggle: ["切换语音", "语音开关", "关闭语音", "开启语音"],
    },
    ms: {
      repeat: ["ulang", "sebut lagi", "ulang arahan"],
      help: ["bantuan", "apa yang boleh saya kata", "arahan suara", "bantuan"],
      toggle: ["tukar suara", "suara hidup mati", "tutup suara", "buka suara"],
    },
  };

  return patterns[language]?.[action] || patterns.en[action];
}

/**
 * Get command descriptions for different languages
 */
function getCommandDescription(action: string, language: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    en: {
      next: "Go to next step",
      back: "Go to previous step",
      skip: "Skip current step",
      repeat: "Repeat instructions",
      help: "Get voice command help",
      toggle: "Toggle voice commands",
    },
    zh: {
      next: "进入下一步",
      back: "返回上一步",
      skip: "跳过当前步骤",
      repeat: "重复指示",
      help: "获取语音命令帮助",
      toggle: "切换语音命令",
    },
    ms: {
      next: "Pergi ke langkah seterusnya",
      back: "Kembali ke langkah sebelum",
      skip: "Langkau langkah semasa",
      repeat: "Ulang arahan",
      help: "Dapatkan bantuan arahan suara",
      toggle: "Tukar arahan suara",
    },
  };

  return descriptions[language]?.[action] || descriptions.en[action];
}

/**
 * Get current instructions (placeholder - would integrate with actual instruction system)
 */
function getCurrentInstructions(language: string): string {
  const instructions: Record<string, string> = {
    en: "Please follow the on-screen instructions for the current step.",
    zh: "请按照当前步骤的屏幕指示操作。",
    ms: "Sila ikut arahan di skrin untuk langkah semasa.",
  };

  return instructions[language] || instructions.en;
}

/**
 * Get help text for voice commands
 */
function getHelpText(language: string): string {
  const helpTexts: Record<string, string> = {
    en: 'Available voice commands: say "next" to continue, "back" to go back, "skip" to skip step, "repeat" for instructions, or "help" for this message.',
    zh: '可用语音命令：说"下一步"继续，"返回"回到上一步，"跳过"跳过步骤，"重复"获取指示，或"帮助"获取此消息。',
    ms: 'Arahan suara yang tersedia: sebut "seterusnya" untuk teruskan, "kembali" untuk balik, "langkau" untuk langkau langkah, "ulang" untuk arahan, atau "bantuan" untuk mesej ini.',
  };

  return helpTexts[language] || helpTexts.en;
}

/**
 * Get voice availability message
 */
function getVoiceAvailabilityMessage(language: string): string {
  const messages: Record<string, string> = {
    en: 'Voice commands are available. Say "help" for available commands.',
    zh: '语音命令可用。说"帮助"获取可用命令。',
    ms: 'Arahan suara tersedia. Sebut "bantuan" untuk arahan yang tersedia.',
  };

  return messages[language] || messages.en;
}
