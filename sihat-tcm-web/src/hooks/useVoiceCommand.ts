/**
 * useVoiceCommand - React hook for voice command functionality
 *
 * This hook provides:
 * - Voice command handler integration
 * - React state management for voice features
 * - Event handling and cleanup
 * - Accessibility integration
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  VoiceCommandHandler,
  VoiceCommandHandlerOptions,
  VoiceCommand,
  VoiceEvent,
  VoiceRecognitionResult,
  VoiceCommandMatch,
  getVoiceCommandHandler,
  checkVoiceSupport,
} from "@/lib/voiceCommandHandler";
import { useAccessibilityContext } from "@/stores/useAppStore";

export interface UseVoiceCommandOptions extends Partial<VoiceCommandHandlerOptions> {
  enabled?: boolean;
  language?: string;
  commands?: VoiceCommand[];
  onResult?: (result: VoiceRecognitionResult) => void;
  onCommand?: (match: VoiceCommandMatch) => void;
  onDictation?: (result: VoiceRecognitionResult) => void;
  onError?: (error: any) => void;
}

export interface VoiceCommandState {
  isSupported: boolean;
  isEnabled: boolean;
  isListening: boolean;
  isDictationMode: boolean;
  isSpeaking: boolean;
  lastResult: VoiceRecognitionResult | null;
  lastCommand: VoiceCommandMatch | null;
  error: string | null;
  commandCount: number;
}

export interface VoiceCommandActions {
  start: () => void;
  stop: () => void;
  speak: (text: string) => Promise<void>;
  startDictation: () => void;
  stopDictation: () => void;
  registerCommand: (command: VoiceCommand) => void;
  unregisterCommand: (commandId: string) => void;
  toggleCommand: (commandId: string, enabled: boolean) => void;
  setLanguage: (language: string) => void;
}

export function useVoiceCommand(
  options: UseVoiceCommandOptions = {}
): [VoiceCommandState, VoiceCommandActions] {
  const { announce } = useAccessibilityContext();
  const handlerRef = useRef<VoiceCommandHandler | null>(null);

  // State
  const [state, setState] = useState<VoiceCommandState>({
    isSupported: false,
    isEnabled: false,
    isListening: false,
    isDictationMode: false,
    isSpeaking: false,
    lastResult: null,
    lastCommand: null,
    error: null,
    commandCount: 0,
  });

  // Initialize voice command handler
  useEffect(() => {
    const support = checkVoiceSupport();

    setState((prev) => ({
      ...prev,
      isSupported: support.fullSupport,
    }));

    if (!support.fullSupport) {
      console.warn("Voice commands not fully supported in this browser");
      return;
    }

    // Create handler with options
    const handlerOptions: Partial<VoiceCommandHandlerOptions> = {
      enableFeedback: true,
      enableCommands: true,
      enableDictation: true,
      autoStart: false,
      debugMode: process.env.NODE_ENV === "development",
      ...options,
    };

    handlerRef.current = getVoiceCommandHandler(handlerOptions);

    // Set language if provided
    if (options.language) {
      handlerRef.current.setLanguage(options.language);
    }

    // Register custom commands
    if (options.commands) {
      options.commands.forEach((command) => {
        handlerRef.current?.registerCommand(command);
      });
    }

    // Setup event listeners
    const handleStart = (event: VoiceEvent) => {
      setState((prev) => ({ ...prev, isListening: true, error: null }));
      announce("Voice recognition started", "polite");
    };

    const handleStop = (event: VoiceEvent) => {
      setState((prev) => ({ ...prev, isListening: false }));
      announce("Voice recognition stopped", "polite");
    };

    const handleResult = (event: VoiceEvent) => {
      const result = event.data as VoiceRecognitionResult;
      setState((prev) => ({ ...prev, lastResult: result }));
      options.onResult?.(result);
    };

    const handleCommand = (event: VoiceEvent) => {
      const match = event.data as VoiceCommandMatch;
      setState((prev) => ({ ...prev, lastCommand: match }));
      options.onCommand?.(match);
      announce(`Command executed: ${match.command.description}`, "polite");
    };

    const handleDictation = (event: VoiceEvent) => {
      const result = event.data as VoiceRecognitionResult;
      options.onDictation?.(result);
    };

    const handleError = (event: VoiceEvent) => {
      const errorMessage = event.data?.message || "Voice recognition error";
      setState((prev) => ({ ...prev, error: errorMessage }));
      options.onError?.(event.data);
      announce(`Voice error: ${errorMessage}`, "assertive");
    };

    // Add event listeners
    handlerRef.current.addEventListener("start", handleStart);
    handlerRef.current.addEventListener("stop", handleStop);
    handlerRef.current.addEventListener("result", handleResult);
    handlerRef.current.addEventListener("command", handleCommand);
    handlerRef.current.addEventListener("dictation", handleDictation);
    handlerRef.current.addEventListener("error", handleError);

    // Update state with handler status
    const updateStatus = () => {
      if (handlerRef.current) {
        const status = handlerRef.current.getStatus();
        setState((prev) => ({
          ...prev,
          isEnabled: status.isEnabled,
          isListening: status.isListening,
          isDictationMode: status.isDictationMode,
          isSpeaking: status.isSpeaking,
          commandCount: status.commandCount,
        }));
      }
    };

    // Initial status update
    updateStatus();

    // Periodic status updates
    const statusInterval = setInterval(updateStatus, 1000);

    // Auto-start if enabled
    if (options.enabled && handlerRef.current) {
      handlerRef.current.start();
    }

    // Cleanup
    return () => {
      clearInterval(statusInterval);

      if (handlerRef.current) {
        handlerRef.current.removeEventListener("start", handleStart);
        handlerRef.current.removeEventListener("stop", handleStop);
        handlerRef.current.removeEventListener("result", handleResult);
        handlerRef.current.removeEventListener("command", handleCommand);
        handlerRef.current.removeEventListener("dictation", handleDictation);
        handlerRef.current.removeEventListener("error", handleError);

        handlerRef.current.stop();
      }
    };
  }, []); // Empty dependency array - only run once

  // Actions
  const actions: VoiceCommandActions = {
    start: useCallback(() => {
      if (handlerRef.current) {
        handlerRef.current.start();
        announce("Voice commands activated", "polite");
      }
    }, [announce]),

    stop: useCallback(() => {
      if (handlerRef.current) {
        handlerRef.current.stop();
        announce("Voice commands deactivated", "polite");
      }
    }, [announce]),

    speak: useCallback(async (text: string) => {
      if (handlerRef.current) {
        try {
          await handlerRef.current.speak(text);
        } catch (error) {
          console.error("Speech synthesis error:", error);
        }
      }
    }, []),

    startDictation: useCallback(() => {
      if (handlerRef.current) {
        handlerRef.current.startDictation();
        announce("Dictation mode started", "assertive");
      }
    }, [announce]),

    stopDictation: useCallback(() => {
      if (handlerRef.current) {
        handlerRef.current.stopDictation();
        announce("Dictation mode stopped", "polite");
      }
    }, [announce]),

    registerCommand: useCallback((command: VoiceCommand) => {
      if (handlerRef.current) {
        handlerRef.current.registerCommand(command);
      }
    }, []),

    unregisterCommand: useCallback((commandId: string) => {
      if (handlerRef.current) {
        handlerRef.current.unregisterCommand(commandId);
      }
    }, []),

    toggleCommand: useCallback((commandId: string, enabled: boolean) => {
      if (handlerRef.current) {
        handlerRef.current.toggleCommand(commandId, enabled);
      }
    }, []),

    setLanguage: useCallback(
      (language: string) => {
        if (handlerRef.current) {
          handlerRef.current.setLanguage(language);
          announce(`Voice language changed to ${language}`, "polite");
        }
      },
      [announce]
    ),
  };

  return [state, actions];
}

/**
 * Hook for voice dictation specifically
 */
export function useVoiceDictation(
  options: {
    onResult?: (text: string) => void;
    onError?: (error: any) => void;
    language?: string;
    enabled?: boolean;
  } = {}
) {
  const [dictationText, setDictationText] = useState("");
  const [isActive, setIsActive] = useState(false);

  const [voiceState, voiceActions] = useVoiceCommand({
    enabled: options.enabled,
    language: options.language,
    enableCommands: false, // Disable commands for dictation-only mode
    enableDictation: true,
    onDictation: (result) => {
      if (result.isFinal) {
        const newText = dictationText + " " + result.transcript;
        setDictationText(newText.trim());
        options.onResult?.(newText.trim());
      }
    },
    onError: options.onError,
  });

  const startDictation = useCallback(() => {
    setDictationText("");
    setIsActive(true);
    voiceActions.startDictation();
  }, [voiceActions]);

  const stopDictation = useCallback(() => {
    setIsActive(false);
    voiceActions.stopDictation();
  }, [voiceActions]);

  const clearText = useCallback(() => {
    setDictationText("");
  }, []);

  return {
    text: dictationText,
    isActive: isActive && voiceState.isDictationMode,
    isSupported: voiceState.isSupported,
    isListening: voiceState.isListening,
    error: voiceState.error,
    start: startDictation,
    stop: stopDictation,
    clear: clearText,
    speak: voiceActions.speak,
  };
}

/**
 * Hook for navigation voice commands
 */
export function useVoiceNavigation(callbacks: {
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}) {
  const navigationCommands: VoiceCommand[] = [
    {
      command: "nav_next",
      patterns: ["next", "continue", "go forward", "proceed", "next step"],
      action: () => callbacks.onNext?.(),
      description: "Go to next step",
      category: "navigation",
      enabled: !!callbacks.onNext,
    },
    {
      command: "nav_back",
      patterns: ["back", "previous", "go back", "return", "previous step"],
      action: () => callbacks.onBack?.(),
      description: "Go to previous step",
      category: "navigation",
      enabled: !!callbacks.onBack,
    },
    {
      command: "nav_skip",
      patterns: ["skip", "skip this", "skip step", "skip this step"],
      action: () => callbacks.onSkip?.(),
      description: "Skip current step",
      category: "navigation",
      enabled: !!callbacks.onSkip,
    },
  ];

  const [voiceState, voiceActions] = useVoiceCommand({
    commands: navigationCommands,
    enableCommands: true,
    enableDictation: false,
  });

  return {
    isSupported: voiceState.isSupported,
    isListening: voiceState.isListening,
    start: voiceActions.start,
    stop: voiceActions.stop,
    speak: voiceActions.speak,
  };
}
