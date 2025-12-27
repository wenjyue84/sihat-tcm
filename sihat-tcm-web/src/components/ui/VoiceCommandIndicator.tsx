/**
 * VoiceCommandIndicator - Visual indicator for voice command status
 *
 * This component provides:
 * - Visual feedback for voice command state
 * - Voice command help and controls
 * - Accessibility announcements
 * - Integration with diagnosis wizard
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useVoiceCommandContext } from "@/components/ui/VoiceCommandProvider";
import { useLanguage } from "@/stores/useAppStore";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  HelpCircle,
  Settings,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceCommandIndicatorProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showHelp?: boolean;
  showSettings?: boolean;
  compact?: boolean;
  className?: string;
}

export function VoiceCommandIndicator({
  position = "top-right",
  showHelp = true,
  showSettings = true,
  compact = false,
  className,
}: VoiceCommandIndicatorProps) {
  const { t } = useLanguage();
  const {
    isSupported,
    isEnabled,
    isListening,
    isDictationMode,
    isSpeaking,
    error,
    start,
    stop,
    speak,
    toggle,
    enableVoiceCommands,
    enableVoiceFeedback,
  } = useVoiceCommandContext();

  const [showHelpPopover, setShowHelpPopover] = useState(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  // Get position classes
  const getPositionClasses = () => {
    const positions = {
      "top-left": "top-4 left-4",
      "top-right": "top-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "bottom-right": "bottom-4 right-4",
    };
    return positions[position];
  };

  // Get status info
  const getStatusInfo = () => {
    if (error) {
      return {
        icon: AlertCircle,
        color: "text-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        status: "Error",
        description: error,
      };
    }

    if (isDictationMode) {
      return {
        icon: isListening ? Mic : Loader2,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        status: "Dictation",
        description: isListening ? "Listening for speech..." : "Processing...",
      };
    }

    if (isSpeaking) {
      return {
        icon: Volume2,
        color: "text-green-500",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        status: "Speaking",
        description: "Providing voice feedback",
      };
    }

    if (isListening) {
      return {
        icon: Mic,
        color: "text-green-500",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        status: "Listening",
        description: "Ready for voice commands",
      };
    }

    if (isEnabled) {
      return {
        icon: Mic,
        color: "text-gray-500",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        status: "Ready",
        description: "Voice commands enabled",
      };
    }

    return {
      icon: MicOff,
      color: "text-gray-400",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      status: "Disabled",
      description: "Voice commands disabled",
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Handle toggle
  const handleToggle = () => {
    if (isEnabled) {
      stop();
    } else {
      start();
    }
  };

  // Render compact version
  if (compact) {
    return (
      <div className={cn("fixed z-50", getPositionClasses(), className)}>
        <Button
          size="sm"
          variant="outline"
          onClick={handleToggle}
          className={cn(
            "h-10 w-10 p-0 rounded-full shadow-lg",
            statusInfo.bgColor,
            statusInfo.borderColor,
            isListening && "animate-pulse"
          )}
          title={`Voice commands: ${statusInfo.status}`}
          aria-label={`Voice commands: ${statusInfo.status}. ${statusInfo.description}`}
        >
          <StatusIcon className={cn("h-4 w-4", statusInfo.color)} />
        </Button>
      </div>
    );
  }

  // Render full version
  return (
    <div className={cn("fixed z-50", getPositionClasses(), className)}>
      <Card
        className={cn(
          "p-3 shadow-lg border-2 transition-all duration-200",
          statusInfo.borderColor,
          statusInfo.bgColor
        )}
      >
        <div className="flex items-center gap-3">
          {/* Status Icon */}
          <div className="relative">
            <StatusIcon
              className={cn(
                "h-5 w-5",
                statusInfo.color,
                (isListening || isSpeaking) && "animate-pulse"
              )}
            />
            {isListening && (
              <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping" />
            )}
          </div>

          {/* Status Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">Voice Commands</span>
              <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
                {statusInfo.status}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 truncate">{statusInfo.description}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Toggle Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggle}
              className="h-8 w-8 p-0"
              title={isEnabled ? "Disable voice commands" : "Enable voice commands"}
            >
              {isEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>

            {/* Help Button */}
            {showHelp && (
              <Popover open={showHelpPopover} onOpenChange={setShowHelpPopover}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    title="Voice command help"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <VoiceCommandHelp />
                </PopoverContent>
              </Popover>
            )}

            {/* Settings Button */}
            {showSettings && (
              <Popover open={showSettingsPopover} onOpenChange={setShowSettingsPopover}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    title="Voice command settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <VoiceCommandSettings />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Voice command help content
 */
function VoiceCommandHelp() {
  const { t } = useLanguage();
  const { speak } = useVoiceCommandContext();

  const commands = [
    {
      category: "Navigation",
      items: [
        { command: "Next", description: "Go to next step" },
        { command: "Back", description: "Go to previous step" },
        { command: "Skip", description: "Skip current step" },
      ],
    },
    {
      category: "Input",
      items: [
        { command: "Start dictation", description: "Begin voice input" },
        { command: "Stop dictation", description: "End voice input" },
      ],
    },
    {
      category: "Control",
      items: [
        { command: "Start recording", description: "Begin audio recording" },
        { command: "Stop recording", description: "End audio recording" },
      ],
    },
    {
      category: "Help",
      items: [
        { command: "Help", description: "Get voice command help" },
        { command: "Repeat", description: "Repeat last instruction" },
      ],
    },
  ];

  const handleSpeak = (text: string) => {
    speak(text);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Voice Commands</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            handleSpeak(
              "Voice commands help. You can say commands like next, back, skip, help, or start dictation."
            )
          }
        >
          <Volume2 className="h-4 w-4 mr-2" />
          Speak
        </Button>
      </div>

      <div className="space-y-3">
        {commands.map((category) => (
          <div key={category.category}>
            <h4 className="text-sm font-medium text-gray-900 mb-2">{category.category}</h4>
            <div className="space-y-1">
              {category.items.map((item) => (
                <div key={item.command} className="flex justify-between items-center text-sm">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                    "{item.command}"
                  </code>
                  <span className="text-gray-600 text-xs">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Speak clearly and wait for the system to process your command. Commands work in your
          current language setting.
        </p>
      </div>
    </div>
  );
}

/**
 * Voice command settings content
 */
function VoiceCommandSettings() {
  const { isEnabled, enableVoiceCommands, enableVoiceFeedback } = useVoiceCommandContext();

  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(isEnabled);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(true);

  const handleVoiceCommandsToggle = (enabled: boolean) => {
    setVoiceCommandsEnabled(enabled);
    enableVoiceCommands(enabled);
  };

  const handleVoiceFeedbackToggle = (enabled: boolean) => {
    setVoiceFeedbackEnabled(enabled);
    enableVoiceFeedback(enabled);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Voice Settings</h3>

      <div className="space-y-3">
        {/* Voice Commands Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Voice Commands</label>
            <p className="text-xs text-gray-500">Enable voice navigation and control</p>
          </div>
          <Button
            size="sm"
            variant={voiceCommandsEnabled ? "default" : "outline"}
            onClick={() => handleVoiceCommandsToggle(!voiceCommandsEnabled)}
          >
            {voiceCommandsEnabled ? "On" : "Off"}
          </Button>
        </div>

        {/* Voice Feedback Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Voice Feedback</label>
            <p className="text-xs text-gray-500">Enable spoken responses and confirmations</p>
          </div>
          <Button
            size="sm"
            variant={voiceFeedbackEnabled ? "default" : "outline"}
            onClick={() => handleVoiceFeedbackToggle(!voiceFeedbackEnabled)}
          >
            {voiceFeedbackEnabled ? "On" : "Off"}
          </Button>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Voice commands require microphone access. Voice feedback uses your device's speech
          synthesis.
        </p>
      </div>
    </div>
  );
}
