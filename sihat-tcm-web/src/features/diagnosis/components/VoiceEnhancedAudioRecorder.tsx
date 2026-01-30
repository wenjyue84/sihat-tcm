/**
 * VoiceEnhancedAudioRecorder - Audio recorder with voice command integration
 *
 * This component enhances the existing AudioRecorder with:
 * - Voice command integration for hands-free operation
 * - Voice feedback for accessibility
 * - Enhanced voice instructions
 */

"use client";

import React, { useEffect } from "react";
import { AudioRecorder } from "./AudioRecorder";
import { useVoiceCommandContext } from "@/components/ui/VoiceCommandProvider";
import { useAccessibilityContext } from "@/stores/useAppStore";
import { useLanguage } from "@/stores/useAppStore";
import { VoiceCommand } from "@/lib/voiceCommandHandler";

interface VoiceEnhancedAudioRecorderProps {
  onComplete: (data: any) => void;
  onBack?: () => void;
  initialData?: any;
}

export function VoiceEnhancedAudioRecorder({
  onComplete,
  onBack,
  initialData,
}: VoiceEnhancedAudioRecorderProps) {
  const { registerCommand, unregisterCommand, speak } = useVoiceCommandContext();
  const { announce } = useAccessibilityContext();
  const { t, language } = useLanguage();

  // Register audio-specific voice commands
  useEffect(() => {
    const audioCommands: VoiceCommand[] = [
      {
        command: "start_audio_recording",
        patterns: getAudioCommandPatterns("start", language),
        action: () => {
          const event = new CustomEvent("audio-start-recording");
          window.dispatchEvent(event);
          speak(getAudioFeedback("started", language));
        },
        description: getAudioCommandDescription("start", language),
        category: "control",
        enabled: true,
      },
      {
        command: "stop_audio_recording",
        patterns: getAudioCommandPatterns("stop", language),
        action: () => {
          const event = new CustomEvent("audio-stop-recording");
          window.dispatchEvent(event);
          speak(getAudioFeedback("stopped", language));
        },
        description: getAudioCommandDescription("stop", language),
        category: "control",
        enabled: true,
      },
      {
        command: "play_audio_recording",
        patterns: getAudioCommandPatterns("play", language),
        action: () => {
          const event = new CustomEvent("audio-play-recording");
          window.dispatchEvent(event);
        },
        description: getAudioCommandDescription("play", language),
        category: "control",
        enabled: true,
      },
      {
        command: "audio_instructions",
        patterns: getAudioCommandPatterns("instructions", language),
        action: () => {
          const instructions = getAudioInstructions(language);
          speak(instructions);
        },
        description: getAudioCommandDescription("instructions", language),
        category: "accessibility",
        enabled: true,
      },
    ];

    // Register commands
    audioCommands.forEach((command) => {
      registerCommand(command);
    });

    // Provide initial voice instructions
    const welcomeMessage = getAudioWelcomeMessage(language);
    setTimeout(() => {
      speak(welcomeMessage);
    }, 1000);

    // Cleanup
    return () => {
      audioCommands.forEach((command) => {
        unregisterCommand(command.command);
      });
    };
  }, [registerCommand, unregisterCommand, speak, language]);

  // Enhanced completion handler with voice feedback
  const handleComplete = (data: any) => {
    const completionMessage = getAudioCompletionMessage(language);
    speak(completionMessage);
    onComplete(data);
  };

  // Enhanced back handler with voice feedback
  const handleBack = () => {
    if (onBack) {
      const backMessage = getAudioBackMessage(language);
      speak(backMessage);
      onBack();
    }
  };

  return (
    <AudioRecorder onComplete={handleComplete} onBack={handleBack} initialData={initialData} />
  );
}

/**
 * Get audio command patterns for different languages
 */
function getAudioCommandPatterns(action: string, language: string): string[] {
  const patterns: Record<string, Record<string, string[]>> = {
    en: {
      start: ["start recording", "begin recording", "record audio", "start audio"],
      stop: ["stop recording", "end recording", "finish recording", "stop audio"],
      play: ["play recording", "play audio", "listen to recording", "playback"],
      instructions: ["audio instructions", "recording help", "how to record", "voice help"],
    },
    zh: {
      start: ["开始录音", "开始录制", "录制音频", "开始录制声音"],
      stop: ["停止录音", "结束录音", "完成录音", "停止录制"],
      play: ["播放录音", "播放音频", "听录音", "回放"],
      instructions: ["录音说明", "录音帮助", "如何录音", "语音帮助"],
    },
    ms: {
      start: ["mula rakam", "mulakan rakaman", "rakam audio", "mula audio"],
      stop: ["henti rakam", "tamat rakaman", "selesai rakam", "henti audio"],
      play: ["main rakaman", "main audio", "dengar rakaman", "putar balik"],
      instructions: ["arahan rakaman", "bantuan rakam", "cara rakam", "bantuan suara"],
    },
  };

  return patterns[language]?.[action] || patterns.en[action];
}

/**
 * Get audio command descriptions for different languages
 */
function getAudioCommandDescription(action: string, language: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    en: {
      start: "Start audio recording",
      stop: "Stop audio recording",
      play: "Play recorded audio",
      instructions: "Get recording instructions",
    },
    zh: {
      start: "开始音频录制",
      stop: "停止音频录制",
      play: "播放录制的音频",
      instructions: "获取录音说明",
    },
    ms: {
      start: "Mulakan rakaman audio",
      stop: "Hentikan rakaman audio",
      play: "Mainkan audio yang dirakam",
      instructions: "Dapatkan arahan rakaman",
    },
  };

  return descriptions[language]?.[action] || descriptions.en[action];
}

/**
 * Get audio feedback messages
 */
function getAudioFeedback(action: string, language: string): string {
  const feedback: Record<string, Record<string, string>> = {
    en: {
      started: "Audio recording started. Please speak clearly.",
      stopped: "Audio recording stopped.",
      playing: "Playing recorded audio.",
      error: "Audio recording error occurred.",
    },
    zh: {
      started: "音频录制已开始。请清晰地说话。",
      stopped: "音频录制已停止。",
      playing: "正在播放录制的音频。",
      error: "音频录制出现错误。",
    },
    ms: {
      started: "Rakaman audio dimulakan. Sila bercakap dengan jelas.",
      stopped: "Rakaman audio dihentikan.",
      playing: "Memainkan audio yang dirakam.",
      error: "Ralat rakaman audio berlaku.",
    },
  };

  return feedback[language]?.[action] || feedback.en[action];
}

/**
 * Get audio instructions
 */
function getAudioInstructions(language: string): string {
  const instructions: Record<string, string> = {
    en: 'For voice analysis, please record yourself saying "Ahh" for 3-5 seconds, then speak normally about your symptoms. You can also cough or clear your throat if relevant to your condition.',
    zh: '对于语音分析，请录制自己说"啊"3-5秒，然后正常说话描述您的症状。如果与您的病情相关，您也可以咳嗽或清嗓子。',
    ms: 'Untuk analisis suara, sila rakam diri anda berkata "Ahh" selama 3-5 saat, kemudian bercakap secara normal tentang gejala anda. Anda juga boleh batuk atau berdehem jika berkaitan dengan keadaan anda.',
  };

  return instructions[language] || instructions.en;
}

/**
 * Get welcome message for audio step
 */
function getAudioWelcomeMessage(language: string): string {
  const messages: Record<string, string> = {
    en: 'Welcome to the voice analysis step. You can use voice commands like "start recording" or "audio instructions" for help.',
    zh: '欢迎来到语音分析步骤。您可以使用"开始录音"或"录音说明"等语音命令获取帮助。',
    ms: 'Selamat datang ke langkah analisis suara. Anda boleh menggunakan arahan suara seperti "mula rakam" atau "arahan rakaman" untuk bantuan.',
  };

  return messages[language] || messages.en;
}

/**
 * Get completion message
 */
function getAudioCompletionMessage(language: string): string {
  const messages: Record<string, string> = {
    en: "Voice analysis completed. Moving to the next step.",
    zh: "语音分析完成。进入下一步。",
    ms: "Analisis suara selesai. Beralih ke langkah seterusnya.",
  };

  return messages[language] || messages.en;
}

/**
 * Get back navigation message
 */
function getAudioBackMessage(language: string): string {
  const messages: Record<string, string> = {
    en: "Going back to the previous step.",
    zh: "返回上一步。",
    ms: "Kembali ke langkah sebelumnya.",
  };

  return messages[language] || messages.en;
}
